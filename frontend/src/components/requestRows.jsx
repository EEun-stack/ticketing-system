import { getRequestTitle, getRequestTypeLabel } from "../utils/requestDisplay";
import { statusLabels } from "../utils/requestStatus";

const boardRoomStatusLabels = {
  PENDING: "Pending review",
  APPROVED: "Approved",
  DECLINED: "Declined",
  CANCELLED: "Cancelled",
};

function RequestRows({ requests, onSelect, unreadRequestIds, isLoading = false }) {
  if (isLoading) return null;
  if (!requests.length) return <p className="empty-state">No submitted requests.</p>;

  return (
    <div className="request-list">
      {requests.map((request) => (
        <button
          className={`request-row ${
            unreadRequestIds?.has(request.id) ? "has-new-request" : ""
          }`}
          type="button"
          key={request.id}
          onClick={() => onSelect?.(request)}
        >
          <span>
            <strong>{request.type === "board-room" ? "Board room meeting" : getRequestTitle(request)}</strong>
            <small>{request.type === "board-room" ? `Booking ID: ${request.id}` : `Control ID: ${request.controlId || "—"}`}</small>
            <small>
              {request.type === "board-room"
                ? `${request.employeeName} - ${request.department} - ${request.subject}`
                : `${request.employeeName} - ${getRequestTypeLabel(request)}`}
            </small>
            {request.type === "board-room" && request.description && <small>{request.description}</small>}
            {request.claimedByName && (
              <small>Ticket is claimed by {request.claimedByName}</small>
            )}
            {request.statusUpdatedByName && (
              <small>
                Acted by {request.statusUpdatedByName}
              </small>
            )}
            {request.status === "RESOLVED" && request.resolvedAt && (
              <small>
                Resolved at {new Date(request.resolvedAt).toLocaleString()}
              </small>
            )}
          </span>
          <span>
            <time>{new Date(request.createdAt).toLocaleString()}</time>
            {unreadRequestIds?.has(request.id) && (
              <strong className="new-request-indicator">New</strong>
            )}
            <em className={`status-badge ${request.status.toLowerCase()}`}>
              {request.type === "board-room" ? boardRoomStatusLabels[request.status] : statusLabels[request.status]}
            </em>
          </span>
        </button>
      ))}
    </div>
  );
}

export default RequestRows;
