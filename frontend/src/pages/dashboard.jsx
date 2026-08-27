import { useEffect, useState } from "react";
import { FaDatabase, FaFilePdf, FaRotate, FaServer } from "react-icons/fa6";
import { adminFetch } from "../api/adminApi";
import RequestRows from "../components/requestRows";
import { exportRequestsPdf, openReportWindow } from "../utils/reportExport";
import { emptyRequestFilters, getRequestQuery } from "../utils/requestFilters";

function Dashboard({ databaseStatus, isOnline, refreshKey, unreadRequestIds }) {
  const [data, setData] = useState({
    total: 0,
    statusCounts: {},
    recent: [],
  });
  const [filters, setFilters] = useState(emptyRequestFilters);
  const [units, setUnits] = useState([]);
  const [message, setMessage] = useState("");

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

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function clearFilters() {
    setFilters(emptyRequestFilters);
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
          <button
            className="icon-button"
            type="button"
            onClick={() => window.location.reload()}
            aria-label="Refresh dashboard"
            title="Refresh dashboard"
          >
            <FaRotate />
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
        >
          <FaDatabase />
          <span>
            <small>Database</small>
            <strong>{databaseStatus}</strong>
          </span>
        </div>
      </div>
      <div className="metric-grid">
        <div className="metric-card">
          <span>Total requests</span>
          <strong>{data.total}</strong>
        </div>
        <div className="metric-card">
          <span>New</span>
          <strong>{data.statusCounts.NEW || 0}</strong>
        </div>
        <div className="metric-card">
          <span>Pending</span>
          <strong>{data.statusCounts.PENDING || 0}</strong>
        </div>
        <div className="metric-card">
          <span>For approval</span>
          <strong>{data.statusCounts.FOR_APPROVAL || 0}</strong>
        </div>
        <div className="metric-card">
          <span>In progress</span>
          <strong>{data.statusCounts.IN_PROGRESS || 0}</strong>
        </div>
        <div className="metric-card">
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
    </section>
  );
}

export default Dashboard;
