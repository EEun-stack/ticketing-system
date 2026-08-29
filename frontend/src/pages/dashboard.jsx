import { useEffect, useState } from "react";
import { FaDatabase, FaFilePdf, FaServer, FaXmark } from "react-icons/fa6";
import { adminFetch } from "../api/adminApi";
import RequestRows from "../components/requestRows";
import { exportRequestsPdf, openReportWindow } from "../utils/reportExport";
import { emptyRequestFilters, getRequestQuery } from "../utils/requestFilters";
import "../styles/dashboard.css";
import "../styles/request.css";
import { statusLabels } from "../utils/requestStatus";

function Dashboard({ databaseStatus, isOnline, refreshKey, unreadRequestIds }) {
  const [data, setData] = useState({
    total: 0,
    statusCounts: {},
    recent: [],
  });
  const [filters, setFilters] = useState(emptyRequestFilters);
  const [units, setUnits] = useState([]);
  const [message, setMessage] = useState("");
  const [selectedCard, setSelectedCard] = useState(null);

  useEffect(() => {
    adminFetch("/api/admin/settings")
      .then((settings) => setUnits(Array.isArray(settings.units) ? settings.units : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    adminFetch(`/api/admin/analytics${getRequestQuery(filters)}`)
      .then(setData)
      .catch(() => {});
  }, [filters, refreshKey]);

  useEffect(() => {
    if (!selectedCard) return undefined;

    function closeOnEscape(event) {
      if (event.key === "Escape") setSelectedCard(null);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedCard]);

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function clearFilters() {
    setFilters(emptyRequestFilters);
  }

  function openCard(card) {
    setSelectedCard(card);
  }

  function handleCardKeyDown(event, card) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openCard(card);
    }
  }

  async function exportReport() {
    const reportWindow = openReportWindow("Overall Request Report");
    if (!reportWindow) {
      setMessage("Please allow popups to export the PDF report.");
      return;
    }

    try {
      setMessage("");
      const requests = await adminFetch(`/api/admin/requests${getRequestQuery(filters)}`);
      exportRequestsPdf({
        reportWindow,
        title: "Overall Request Report",
        subtitle: `Generated ${new Date().toLocaleString()}`,
        filters,
        requests,
      });
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="admin-panel">
      <div className="panel-heading">
        <div>
          <p className="home-eyebrow">System overview</p>
          <h1>Dashboard</h1>
        </div>
        <div className="panel-actions">
          <button
            className="text-button"
            type="button"
            onClick={exportReport}
            title="Export PDF"
          >
            <FaFilePdf />
            Export PDF
          </button>
        </div>
      </div>
      {message && <p className="error-message">{message}</p>}

      <div className="filter-bar" aria-label="Dashboard filters">
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
          Unit
          <select
            value={filters.unit}
            onChange={(event) => updateFilter("unit", event.target.value)}
          >
            <option value="">All units</option>
            {units.map((unit) => (
              <option value={unit} key={unit}>
                {unit}
              </option>
            ))}
          </select>
        </label>
        <button className="text-button" type="button" onClick={clearFilters}>
          Clear
        </button>
      </div>

      <div className="health-grid">
        <div
          className={`health-indicator ${
            isOnline ? "healthy" : "unhealthy"
          }`}
          role="button"
          tabIndex="0"
          onClick={() => openCard({ label: "Backend", value: isOnline ? "Online" : "Offline" })}
          onKeyDown={(event) => handleCardKeyDown(event, { label: "Backend", value: isOnline ? "Online" : "Offline" })}
        >
          <FaServer />
          <span>
            <small>Backend</small>
            <strong>{isOnline ? "Online" : "Offline"}</strong>
          </span>
        </div>
        <div
          className={`health-indicator ${
            databaseStatus === "Connected" ? "healthy" : "unhealthy"
          }`}
          role="button"
          tabIndex="0"
          onClick={() => openCard({ label: "Database", value: databaseStatus })}
          onKeyDown={(event) => handleCardKeyDown(event, { label: "Database", value: databaseStatus })}
        >
          <FaDatabase />
          <span>
            <small>Database</small>
            <strong>{databaseStatus}</strong>
          </span>
        </div>
      </div>
      <div className="metric-grid">
        <div className="metric-card" role="button" tabIndex="0" onClick={() => openCard({ label: "Total requests", value: data.total })} onKeyDown={(event) => handleCardKeyDown(event, { label: "Total requests", value: data.total })}>
          <span>Total requests</span>
          <strong>{data.total}</strong>
        </div>
        <div className="metric-card" role="button" tabIndex="0" onClick={() => openCard({ label: "New", status: "NEW", value: data.statusCounts.NEW || 0 })} onKeyDown={(event) => handleCardKeyDown(event, { label: "New", status: "NEW", value: data.statusCounts.NEW || 0 })}>
          <span>New</span>
          <strong>{data.statusCounts.NEW || 0}</strong>
        </div>
        <div className="metric-card" role="button" tabIndex="0" onClick={() => openCard({ label: "Pending", status: "PENDING", value: data.statusCounts.PENDING || 0 })} onKeyDown={(event) => handleCardKeyDown(event, { label: "Pending", status: "PENDING", value: data.statusCounts.PENDING || 0 })}>
          <span>Pending</span>
          <strong>{data.statusCounts.PENDING || 0}</strong>
        </div>
        <div className="metric-card" role="button" tabIndex="0" onClick={() => openCard({ label: "For approval", status: "FOR_APPROVAL", value: data.statusCounts.FOR_APPROVAL || 0 })} onKeyDown={(event) => handleCardKeyDown(event, { label: "For approval", status: "FOR_APPROVAL", value: data.statusCounts.FOR_APPROVAL || 0 })}>
          <span>For approval</span>
          <strong>{data.statusCounts.FOR_APPROVAL || 0}</strong>
        </div>
        <div className="metric-card" role="button" tabIndex="0" onClick={() => openCard({ label: "In progress", status: "IN_PROGRESS", value: data.statusCounts.IN_PROGRESS || 0 })} onKeyDown={(event) => handleCardKeyDown(event, { label: "In progress", status: "IN_PROGRESS", value: data.statusCounts.IN_PROGRESS || 0 })}>
          <span>In progress</span>
          <strong>{data.statusCounts.IN_PROGRESS || 0}</strong>
        </div>
        <div className="metric-card" role="button" tabIndex="0" onClick={() => openCard({ label: "Resolved", status: "RESOLVED", value: data.statusCounts.RESOLVED || 0 })} onKeyDown={(event) => handleCardKeyDown(event, { label: "Resolved", status: "RESOLVED", value: data.statusCounts.RESOLVED || 0 })}>
          <span>Resolved</span>
          <strong>{data.statusCounts.RESOLVED || 0}</strong>
        </div>
      </div>
      <div className="panel-section">
        <div className="section-heading">
          <h2>Recent requests</h2>
          <span>{data.recent.length} latest</span>
        </div>
        <RequestRows requests={data.recent} unreadRequestIds={unreadRequestIds} />
      </div>
      {selectedCard && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelectedCard(null)}>
          <div className="request-modal dashboard-modal" role="dialog" aria-modal="true" aria-labelledby="dashboard-modal-title" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close icon-button" type="button" onClick={() => setSelectedCard(null)} aria-label="Close dashboard details">
              <FaXmark aria-hidden="true" />
            </button>
            <p className="home-eyebrow">Dashboard details</p>
            <h2 id="dashboard-modal-title">{selectedCard.label}</h2>
            <p className="modal-meta">Current value: {selectedCard.value}</p>
            {selectedCard.status && (
              <div className="dashboard-modal-requests">
                <h3>Recent matching requests</h3>
                {data.recent.filter((request) => request.status === selectedCard.status).length ? (
                  data.recent
                    .filter((request) => request.status === selectedCard.status)
                    .map((request) => (
                      <p key={request.id}>
                        <strong>{request.employeeName}</strong> - {request.subject || request.requestType} - {new Date(request.createdAt).toLocaleString()}
                      </p>
                    ))
                ) : <p>No matching requests in the recent list.</p>}
                <small>Status: {statusLabels[selectedCard.status]}</small>
              </div>
            )}
            {!selectedCard.status && <p className="modal-description">{selectedCard.label} is currently {selectedCard.value.toString().toLowerCase()}.</p>}
          </div>
        </div>
      )}
    </section>
  );
}

export default Dashboard;
