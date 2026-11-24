import { useEffect, useRef, useState } from "react";
import { FaFileCsv, FaFilePdf, FaXmark } from "react-icons/fa6";
import { adminFetch } from "../api/adminApi";
import { emptyRequestFilters, getRequestQuery } from "../utils/requestFilters";
import { exportRequestsPdf, openReportWindow } from "../utils/reportExport";
import "../styles/request.css";
import "../styles/boardRoomBookings.css";

const statusLabels = {
  PENDING: "Pending",
  APPROVED: "Approved",
  DECLINED: "Declined",
  CANCELLED: "Cancelled",
};

function BoardRoomBookings({ onBookingViewed, unreadBoardRoomIds }) {
  const [bookings, setBookings] = useState([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [units, setUnits] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [revertConfirmation, setRevertConfirmation] = useState("");
  const [isRevertModalOpen, setIsRevertModalOpen] = useState(false);
  const [filters, setFilters] = useState({ ...emptyRequestFilters, requestType: "" });
  const [showFilters, setShowFilters] = useState(() => localStorage.getItem("boardRoomFiltersVisible") !== "false");
  const loadTimeoutRef = useRef(null);
  const query = getRequestQuery(filters);

  useEffect(() => {
    localStorage.setItem("boardRoomFiltersVisible", String(showFilters));
  }, [showFilters]);

  async function loadBookings() {
    if (loadTimeoutRef.current) window.clearTimeout(loadTimeoutRef.current);
    setIsLoading(true);
    loadTimeoutRef.current = window.setTimeout(async () => {
      try {
        setBookings(await adminFetch(`/api/admin/board-room-bookings${query}`));
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
    adminFetch(`/api/requests/settings?boardRoomUnits=${Date.now()}`)
      .then((settings) => setUnits(Array.isArray(settings.units) ? settings.units : []))
      .catch(() => setUnits([]));
    return () => {
      if (loadTimeoutRef.current) window.clearTimeout(loadTimeoutRef.current);
    };
  }, [query]);

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function clearFilters() {
    setFilters({ ...emptyRequestFilters, requestType: "" });
  }

  function getExportRows() {
    return bookings.map((booking) => ({
      controlId: booking.id,
      createdAt: booking.createdAt,
      employeeName: booking.name,
      department: booking.department,
      requestType: "Board room",
      subject: `${booking.date} at ${booking.startTime}${booking.endTime ? ` - ${booking.endTime}` : ""}`,
      description: `${booking.attendees} attendees - ${booking.purpose}`,
      status: booking.status,
    }));
  }

  function exportReport() {
    const reportWindow = openReportWindow("Board Room Booking Report");
    if (!reportWindow) {
      setMessage("Please allow popups to export the PDF report.");
      return;
    }

    exportRequestsPdf({
      reportWindow,
      title: "Board Room Booking Report",
      subtitle: `Generated ${new Date().toLocaleString()}`,
      filters,
      requests: getExportRows(),
    });
  }

  function exportCsv() {
    const columns = ["Booking ID", "Created", "Scheduled date", "Start time", "End time", "Requester", "Department", "Attendees", "Status", "Purpose"];
    const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = bookings.map((booking) => [
      booking.id,
      booking.createdAt,
      booking.date,
      booking.startTime,
      booking.endTime,
      booking.name,
      booking.department,
      booking.attendees,
      statusLabels[booking.status] || booking.status,
      booking.purpose,
    ]);
    const csv = [columns, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `board-room-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function openBooking(booking) {
    onBookingViewed?.({ ...booking, type: "board-room" });
    setSelectedBooking(booking);
  }

  async function updateStatus(id, status, confirmation = "") {
    try {
      const updated = await adminFetch(`/api/admin/board-room-bookings/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, ...(confirmation ? { confirmation } : {}) }),
      });
      setBookings((current) => current.map((booking) => (booking.id === updated.id ? updated : booking)));
      setSelectedBooking(updated);
      setIsRevertModalOpen(false);
      setRevertConfirmation("");
      setMessage(`Booking ${statusLabels[status].toLowerCase()}.`);
    } catch (error) {
      setMessage(error.message);
    }
  }

  function changeBookingStatus(status) {
    if (status === "PENDING" && selectedBooking?.status !== "PENDING") {
      setRevertConfirmation("");
      setIsRevertModalOpen(true);
      return;
    }

    updateStatus(selectedBooking.id, status);
  }

  async function deleteBooking() {
    if (!selectedBooking || !window.confirm("Delete this board room booking? This cannot be undone.")) return;

    try {
      await adminFetch(`/api/admin/board-room-bookings/${selectedBooking.id}`, { method: "DELETE" });
      setBookings((current) => current.filter((booking) => booking.id !== selectedBooking.id));
      setSelectedBooking(null);
      setMessage("Booking deleted.");
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
        <div className="panel-actions">
          <button className="text-button" type="button" onClick={() => setShowFilters((current) => !current)} title={showFilters ? "Hide filters" : "Show filters"}>
            {showFilters ? "Hide filters" : "Show filters"}
          </button>
          <button className="text-button" type="button" onClick={exportReport} title="Export PDF">
            <FaFilePdf />
            Export PDF
          </button>
          <button className="text-button" type="button" onClick={exportCsv} title="Export CSV for Excel">
            <FaFileCsv />
            Export CSV
          </button>
        </div>
      </div>
      {showFilters && <div className="board-room-filter-bar" aria-label="Board room booking filters">
        <label>From<input type="date" value={filters.dateFrom} onChange={(event) => updateFilter("dateFrom", event.target.value)} /></label>
        <label>To<input type="date" value={filters.dateTo} onChange={(event) => updateFilter("dateTo", event.target.value)} /></label>
        <label>Requester<input type="search" value={filters.name} onChange={(event) => updateFilter("name", event.target.value)} placeholder="Search name" /></label>
        <label>Department<select value={filters.unit} onChange={(event) => updateFilter("unit", event.target.value)}><option value="">All departments</option>{units.map((unit) => <option value={unit} key={unit}>{unit}</option>)}</select></label>
        <label>Status<select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}><option value="">All statuses</option>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <button className="text-button booking-clear-filters" type="button" onClick={clearFilters}>Clear</button>
      </div>}
      {message && <p className="save-message" role="status">{message}</p>}
      {isLoading ? (
        <p className="loading-indicator" aria-live="polite">Loading board room bookings...</p>
      ) : bookings.length === 0 ? (
        <p className="empty-state">No board room bookings have been submitted.</p>
      ) : (
        <div className="request-list board-room-booking-list">
          {bookings.map((booking) => (
            <div
              className={`request-row board-room-booking-row ${unreadBoardRoomIds?.has(booking.id) ? "has-new-booking" : ""}`}
              key={booking.id}
              role="button"
              tabIndex="0"
              onClick={() => openBooking(booking)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openBooking(booking);
                }
              }}
            >
              <span>
                <strong>{booking.name}</strong>
                <small>Board room: {new Date(booking.date).toLocaleDateString()} at {booking.startTime}{booking.endTime ? ` - ${booking.endTime}` : ""}</small>
                <small>{booking.department} - {booking.attendees} attendees</small>
                <small>{booking.purpose}</small>
                {booking.reviewedByName && (
                  <small>Acted by {booking.reviewedByName}{booking.reviewedAt ? ` on ${new Date(booking.reviewedAt).toLocaleString()}` : ""}</small>
                )}
              </span>
              <span>
                <time>Created {new Date(booking.createdAt).toLocaleString()}</time>
                {unreadBoardRoomIds?.has(booking.id) && <strong className="new-request-indicator">New</strong>}
                <em className={`status-badge ${booking.status.toLowerCase()}`}>{statusLabels[booking.status] || booking.status}</em>
                {booking.status === "PENDING" && (
                  <span className="board-room-inline-actions">
                    <button className="text-button booking-approve" type="button" onClick={(event) => { event.stopPropagation(); updateStatus(booking.id, "APPROVED"); }}>Approve</button>
                    <button className="text-button booking-decline" type="button" onClick={(event) => { event.stopPropagation(); updateStatus(booking.id, "DECLINED"); }}>Decline</button>
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
      {selectedBooking && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelectedBooking(null)}>
          <div className="request-modal board-room-booking-modal" role="dialog" aria-modal="true" aria-labelledby="board-room-booking-title" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close icon-button" type="button" onClick={() => setSelectedBooking(null)} aria-label="Close booking details"><FaXmark /></button>
            <p className="home-eyebrow">Request details</p>
            <h2 id="board-room-booking-title">Board room booking</h2>
            <p className="modal-meta">
              Booking ID: {selectedBooking.id} · {selectedBooking.name} · {selectedBooking.department} · Created {new Date(selectedBooking.createdAt).toLocaleString()}
            </p>
            <div className="board-room-booking-modal-details">
              <strong>{new Date(selectedBooking.date).toLocaleDateString(undefined, { dateStyle: "full" })}</strong>
              <span>{selectedBooking.startTime}{selectedBooking.endTime ? ` - ${selectedBooking.endTime}` : ""} · {selectedBooking.attendees} attendees</span>
            </div>
            <p className="modal-description">{selectedBooking.purpose}</p>
            {selectedBooking.reviewedByName && (
              <p className="modal-audit">
                Acted by {selectedBooking.reviewedByName}
                {selectedBooking.reviewedAt ? ` on ${new Date(selectedBooking.reviewedAt).toLocaleString()}` : ""}
              </p>
            )}
            <label className="modal-field">
              Status
              <select
                value={selectedBooking.status}
                onChange={(event) => changeBookingStatus(event.target.value)}
                disabled={selectedBooking.status === "APPROVED"}
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            {selectedBooking.status === "APPROVED" && (
              <>
                <p className="modal-lock-note">Approved bookings are locked. Revert the approval to move this booking back to pending.</p>
                <button
                  className="revert-request-button"
                  type="button"
                  onClick={() => {
                    setRevertConfirmation("");
                    setIsRevertModalOpen(true);
                  }}
                >
                  Revert approval
                </button>
              </>
            )}
            <div className="board-room-booking-modal-actions">
              <button className="text-button booking-delete" type="button" onClick={deleteBooking}>Delete booking</button>
            </div>
          </div>
        </div>
      )}
      {isRevertModalOpen && selectedBooking && (
        <div className="modal-backdrop revert-backdrop" role="presentation">
          <div className="request-modal revert-modal" role="dialog" aria-modal="true" aria-labelledby="revert-booking-title">
            <p className="home-eyebrow">Revert booking</p>
            <h2 id="revert-booking-title">Move this booking back to pending?</h2>
            <p className="modal-lock-note">This action clears the current review and is recorded in the activity log.</p>
            <label className="modal-field revert-confirmation-field">
              Type REVERT to confirm
              <input
                type="text"
                value={revertConfirmation}
                onChange={(event) => setRevertConfirmation(event.target.value)}
                autoComplete="off"
                autoFocus
              />
            </label>
            <div className="revert-modal-actions">
              <button className="text-button" type="button" onClick={() => setIsRevertModalOpen(false)}>
                Cancel
              </button>
              <button
                className="primary-button"
                type="button"
                disabled={revertConfirmation !== "REVERT"}
                onClick={() => updateStatus(selectedBooking.id, "PENDING", revertConfirmation)}
              >
                Confirm revert
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default BoardRoomBookings;
