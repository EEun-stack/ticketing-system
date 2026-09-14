import { useEffect, useRef, useState } from "react";
import { adminFetch } from "../api/adminApi";
import "../styles/boardRoomBookings.css";

const statusLabels = {
  PENDING: "Pending",
  APPROVED: "Approved",
  DECLINED: "Declined",
  CANCELLED: "Cancelled",
};

function BoardRoomBookings() {
  const [bookings, setBookings] = useState([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const loadTimeoutRef = useRef(null);

  async function loadBookings() {
    if (loadTimeoutRef.current) window.clearTimeout(loadTimeoutRef.current);
    setIsLoading(true);
    loadTimeoutRef.current = window.setTimeout(async () => {
      try {
        setBookings(await adminFetch("/api/admin/board-room-bookings"));
        setMessage("");
      } catch (error) {
        setMessage(error.message);
      } finally {
        setIsLoading(false);
        loadTimeoutRef.current = null;
      }
    }, 3000);
  }

  useEffect(() => {
    loadBookings();
    return () => {
      if (loadTimeoutRef.current) window.clearTimeout(loadTimeoutRef.current);
    };
  }, []);

  async function updateStatus(id, status) {
    try {
      const updated = await adminFetch(`/api/admin/board-room-bookings/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setBookings((current) => current.map((booking) => (booking.id === updated.id ? updated : booking)));
      setMessage(`Booking ${statusLabels[status].toLowerCase()}.`);
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="admin-panel board-room-bookings-page">
      <div className="panel-heading">
        <div>
          <p className="home-eyebrow">Facilities</p>
          <h1>Board room bookings</h1>
        </div>
        <button className="text-button" type="button" onClick={loadBookings}>Refresh</button>
      </div>
      {message && <p className="save-message" role="status">{message}</p>}
      {isLoading ? (
        <p className="loading-indicator" aria-live="polite">Loading board room bookings...</p>
      ) : bookings.length === 0 ? (
        <p className="empty-state">No board room bookings have been submitted.</p>
      ) : (
        <div className="board-room-booking-list">
          {bookings.map((booking) => (
            <article className="board-room-booking-row" key={booking.id}>
              <div className="board-room-booking-date">
                <strong>{new Date(booking.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</strong>
                <span>{booking.startTime}</span>
              </div>
              <div className="board-room-booking-details">
                <strong>{booking.name}</strong>
                <span>{booking.department} · {booking.attendees} attendees</span>
                <p>{booking.purpose}</p>
              </div>
              <div className="board-room-booking-actions">
                <span className={`booking-status ${booking.status.toLowerCase()}`}>{statusLabels[booking.status] || booking.status}</span>
                {booking.status === "PENDING" && (
                  <div>
                    <button className="text-button booking-approve" type="button" onClick={() => updateStatus(booking.id, "APPROVED")}>Approve</button>
                    <button className="text-button booking-decline" type="button" onClick={() => updateStatus(booking.id, "DECLINED")}>Decline</button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default BoardRoomBookings;
