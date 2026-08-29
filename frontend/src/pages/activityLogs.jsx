import { useEffect, useMemo, useState } from "react";
import { FaArrowsRotate, FaXmark } from "react-icons/fa6";
import { adminFetch } from "../api/adminApi";
import "../styles/activityLogs.css";

const emptyActivityFilters = {
  dateFrom: "",
  dateTo: "",
  actor: "",
  action: "",
  requester: "",
  requestType: "",
};

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
  const [filters, setFilters] = useState(emptyActivityFilters);

  const actionOptions = useMemo(
    () => [...new Set(logs.map((log) => log.action))].sort(),
    [logs],
  );

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const createdAt = new Date(log.createdAt).getTime();
      const actorValue = (log.actorName || log.actorEmail || (log.action === "USER_LOGIN_FAILED" ? "Unknown user" : "Guest")).toLowerCase();
      const requesterValue = (log.targetName || "").toLowerCase();
      const requestTypeValue = (log.requestType || "").toLowerCase();
      const actionValue = (log.action || "").toLowerCase();

      if (filters.dateFrom) {
        const startOfDay = new Date(`${filters.dateFrom}T00:00:00`).getTime();
        if (createdAt < startOfDay) return false;
      }

      if (filters.dateTo) {
        const endOfDay = new Date(`${filters.dateTo}T23:59:59`).getTime();
        if (createdAt > endOfDay) return false;
      }

      if (filters.actor && !actorValue.includes(filters.actor.trim().toLowerCase())) return false;
      if (filters.action && actionValue !== filters.action.toLowerCase()) return false;
      if (filters.requester && !requesterValue.includes(filters.requester.trim().toLowerCase())) return false;
      if (filters.requestType && !requestTypeValue.includes(filters.requestType.trim().toLowerCase())) return false;

      return true;
    });
  }, [filters, logs]);

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

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function clearFilters() {
    setFilters(emptyActivityFilters);
  }

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

      <div className="filter-bar activity-filter-bar" aria-label="Activity log filters">
        <label>
          From
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(event) => updateFilter("dateFrom", event.target.value)}
          />
        </label>
        <label>
          To
          <input
            type="date"
            value={filters.dateTo}
            onChange={(event) => updateFilter("dateTo", event.target.value)}
          />
        </label>
        <label>
          Actor
          <input
            type="search"
            value={filters.actor}
            onChange={(event) => updateFilter("actor", event.target.value)}
            placeholder="Name or email"
          />
        </label>
        <label>
          Action
          <select
            value={filters.action}
            onChange={(event) => updateFilter("action", event.target.value)}
          >
            <option value="">All actions</option>
            {actionOptions.map((action) => (
              <option value={action} key={action}>
                {formatAction(action)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Requester
          <input
            type="search"
            value={filters.requester}
            onChange={(event) => updateFilter("requester", event.target.value)}
            placeholder="Requester name"
          />
        </label>
        <label>
          Type
          <select
            value={filters.requestType}
            onChange={(event) => updateFilter("requestType", event.target.value)}
          >
            <option value="">All types</option>
            {Array.from(new Set(logs.map((log) => log.requestType).filter(Boolean))).map((type) => (
              <option value={type} key={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <button className="text-button" type="button" onClick={clearFilters}>
          Clear
        </button>
      </div>

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
            {filteredLogs.length ? filteredLogs.map((log) => (
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
                <td colSpan="5">{isLoading ? "Loading activity..." : "No matching activity found."}</td>
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