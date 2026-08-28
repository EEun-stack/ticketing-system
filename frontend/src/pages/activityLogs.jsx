import { useEffect, useState } from "react";
import { FaArrowsRotate, FaXmark } from "react-icons/fa6";
import { adminFetch } from "../api/adminApi";
import "../styles/activityLogs.css";

function formatAction(action) {
  return action
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadLogs() {
    setIsLoading(true);
    try {
      setLogs(await adminFetch("/api/admin/activity-logs"));
      setMessage("");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    if (!selectedLog) return undefined;

    function closeOnEscape(event) {
      if (event.key === "Escape") setSelectedLog(null);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedLog]);

  function handleLogKeyDown(event, log) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSelectedLog(log);
    }
  }

  return (
    <section className="admin-panel">
      <div className="panel-heading">
        <div>
          <p className="home-eyebrow">System history</p>
          <h1>Activity logs</h1>
        </div>
        <button
          className="icon-button"
          type="button"
          onClick={loadLogs}
          disabled={isLoading}
          aria-label="Refresh activity logs"
          title="Refresh activity logs"
        >
          <FaArrowsRotate />
        </button>
      </div>

      {message && <p className="error-message">{message}</p>}
      <div className="activity-table-wrap">
        <table className="activity-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Action</th>
              <th>Actor</th>
              <th>Requester</th>
              <th>Request type</th>
            </tr>
          </thead>
          <tbody>
            {logs.length ? logs.map((log) => (
              <tr
                key={log.id}
                className="activity-row"
                onClick={() => setSelectedLog(log)}
                onKeyDown={(event) => handleLogKeyDown(event, log)}
                tabIndex="0"
                role="button"
                aria-label={`View details for ${formatAction(log.action)}`}
              >
                <td>{new Date(log.createdAt).toLocaleString()}</td>
                <td><strong>{formatAction(log.action)}</strong></td>
                <td>{log.actorName || log.actorEmail || (log.action === "USER_LOGIN_FAILED" ? "Unknown user" : "Guest")}</td>
                <td>{log.targetName || "-"}</td>
                <td>{log.requestType || "-"}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5">{isLoading ? "Loading activity..." : "No activity recorded yet."}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedLog && (
        <div
          className="activity-modal-backdrop"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setSelectedLog(null);
          }}
        >
          <section
            className="activity-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="activity-modal-title"
          >
            <div className="activity-modal-heading">
              <div>
                <p className="home-eyebrow">Activity details</p>
                <h2 id="activity-modal-title">{formatAction(selectedLog.action)}</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={() => setSelectedLog(null)}
                aria-label="Close activity details"
                title="Close"
              >
                <FaXmark aria-hidden="true" />
              </button>
            </div>
            <dl className="activity-detail-list">
              <div><dt>Time</dt><dd>{new Date(selectedLog.createdAt).toLocaleString()}</dd></div>
              <div><dt>Actor</dt><dd>{selectedLog.actorName || selectedLog.actorEmail || (selectedLog.action === "USER_LOGIN_FAILED" ? "Unknown user" : "Guest")}</dd></div>
              <div><dt>Requester</dt><dd>{selectedLog.targetName || "-"}</dd></div>
              <div><dt>Request type</dt><dd>{selectedLog.requestType || "-"}</dd></div>
            </dl>
          </section>
        </div>
      )}
    </section>
  );
}

export default ActivityLogs;