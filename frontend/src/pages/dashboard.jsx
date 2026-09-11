import { useEffect, useState } from "react";
import { FaDatabase, FaFilePdf, FaServer, FaXmark } from "react-icons/fa6";
import { adminFetch } from "../api/adminApi";
import RequestRows from "../components/requestRows";
import { exportRequestsPdf, openReportWindow } from "../utils/reportExport";
import { emptyRequestFilters, getRequestQuery } from "../utils/requestFilters";
import { getTableCache, setTableCache } from "../utils/tableCache";
import "../styles/dashboard.css";
import "../styles/request.css";
import { statusLabels } from "../utils/requestStatus";

function Dashboard({ currentUserRole = "SUPERADMIN", databaseStatus, isOnline, onRequestSelect, refreshKey, unreadRequestIds }) {
  const [data, setData] = useState({
    total: 0,
    statusCounts: {},
    recent: [],
  });
  const [filters, setFilters] = useState(emptyRequestFilters);
  const [units, setUnits] = useState([]);
  const [message, setMessage] = useState("");
  const [selectedCard, setSelectedCard] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(() => localStorage.getItem("dashboardFiltersVisible") !== "false");

  useEffect(() => {
    localStorage.setItem("dashboardFiltersVisible", String(showFilters));
  }, [showFilters]);

  const summaryStatusOrder = currentUserRole === "ADMIN"
    ? ["NEW", "PENDING", "FOR_APPROVAL", "RESOLVED"]
    : ["NEW", "PENDING", "FOR_APPROVAL", "IN_PROGRESS", "RESOLVED"];
  const chartMaxValue = Math.max(
    ...summaryStatusOrder.map((status) => Number(data.statusCounts[status] || 0)),
    1,
  );

  useEffect(() => {
    const cachedSettings = getTableCache("/api/requests/settings");
    if (cachedSettings) {
      setUnits(Array.isArray(cachedSettings.units) ? cachedSettings.units : []);
      return;
    }

    adminFetch("/api/requests/settings")
      .then((settings) => {
        setTableCache("/api/requests/settings", settings);
        setUnits(Array.isArray(settings.units) ? settings.units : []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const cacheKey = `/api/admin/analytics${getRequestQuery(filters)}`;
    const cachedData = getTableCache(cacheKey);
    if (cachedData) {
      setData(cachedData);
      setIsLoading(false);
      return undefined;
    }

    setIsLoading(true);
    const timeout = window.setTimeout(() => {
      adminFetch(`/api/admin/analytics${getRequestQuery(filters)}`)
        .then((nextData) => {
          setTableCache(cacheKey, nextData);
          setData(nextData);
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }, 3000);

    return () => window.clearTimeout(timeout);
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
      const requestQuery = getRequestQuery(filters);
      const requests = await adminFetch(`/api/admin/requests${requestQuery ? `${requestQuery}&scope=mine` : '?scope=mine'}`);
      exportRequestsPdf({
        reportWindow,
        title: "Overall Request Report",
        subtitle: `Generated ${new Date().toLocaleString()}`,
        filters,
        requests,
        analytics: {
          total: data.total,
          statusCounts: data.statusCounts,
          adminActivity: data.adminActivity,
          monthlyByDepartment: data.monthlyByDepartment,
          statusOrder: summaryStatusOrder,
        },
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
            onClick={() => setShowFilters((current) => !current)}
            title={showFilters ? "Hide filters" : "Show filters"}
          >
            {showFilters ? "Hide filters" : "Show filters"}
          </button>
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
      {isLoading && <p className="loading-indicator" aria-live="polite">Loading dashboard...</p>}

      {showFilters && (
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
      )}

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
      {!isLoading && <>
      <div className="metric-grid">
        {currentUserRole !== "ADMIN" && (
          <div className="metric-card" role="button" tabIndex="0" onClick={() => openCard({ label: "Total requests", value: data.total })} onKeyDown={(event) => handleCardKeyDown(event, { label: "Total requests", value: data.total })}>
            <span>Total requests</span>
            <strong>{data.total}</strong>
          </div>
        )}
        {summaryStatusOrder.map((status) => (
          <div
            className="metric-card"
            key={status}
            role="button"
            tabIndex="0"
            onClick={() => openCard({ label: statusLabels[status], status, value: data.statusCounts[status] || 0 })}
            onKeyDown={(event) => handleCardKeyDown(event, { label: statusLabels[status], status, value: data.statusCounts[status] || 0 })}
          >
            <span>{statusLabels[status]}</span>
            <strong>{data.statusCounts[status] || 0}</strong>
          </div>
        ))}
      </div>
      <div className="dashboard-bottom-grid">
        <div className="panel-group">
          <div className="section-heading">
            <h2>Analytics</h2>
            <span>{summaryStatusOrder.length} statuses</span>
          </div>
          <div className="panel-section analytics-panel">
            <div className="status-chart" role="img" aria-label="Request status analytics chart">
              {summaryStatusOrder.map((status) => {
                const value = Number(data.statusCounts[status] || 0);
                const width = Math.max((value / chartMaxValue) * 100, value > 0 ? 8 : 0);

                return (
                  <div className="status-chart-row" key={status}>
                    <div className="status-chart-labels">
                      <span>{statusLabels[status]}</span>
                      <strong>{value}</strong>
                    </div>
                    <div className="status-chart-bar-track" aria-hidden="true">
                      <div
                        className={`status-chart-bar ${status.toLowerCase()}`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {currentUserRole === "SUPERADMIN" && (
          <>
            <div className="panel-group">
              <div className="section-heading">
                <h2>Admin activity</h2>
                <span>{data.adminActivity?.length || 0} admins</span>
              </div>
              <div className="panel-section analytics-panel">
                {data.adminActivity?.length ? (
                  <div className="admin-activity-chart" role="img" aria-label="Admin activity analytics chart">
                    {data.adminActivity.slice(0, 8).map((admin) => {
                      const maxCount = Math.max(...data.adminActivity.map((item) => item.count), 1);
                      const barHeight = Math.max((admin.count / maxCount) * 100, 12);

                      return (
                        <div className="admin-activity-column" key={admin.name || admin.email || 'unknown'}>
                          <div className="admin-activity-bar-wrapper" aria-hidden="true">
                            <div className="admin-activity-bar" style={{ height: `${barHeight}%` }} />
                          </div>
                          <span>{admin.name}</span>
                          <strong>{admin.count}</strong>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="empty-state">No admin activity recorded.</p>
                )}
              </div>
            </div>

            <div className="panel-group">
              <div className="section-heading">
                <h2>Overall requests</h2>
                <span>{data.monthlyByDepartment?.length || 0} departments</span>
              </div>
              <div className="panel-section analytics-panel">
                {data.monthlyByDepartment?.length ? (
                  <div className="status-chart" role="img" aria-label="Overall request counts by department analytics chart">
                    {data.monthlyByDepartment.slice(0, 8).map((item) => (
                      <div className="status-chart-row" key={item.department}>
                        <div className="status-chart-labels">
                          <span>{item.department}</span>
                          <strong>{item.count}</strong>
                        </div>
                        <div className="status-chart-bar-track" aria-hidden="true">
                          <div
                            className="status-chart-bar pending"
                            style={{ width: `${Math.max((item.count / Math.max(...(data.monthlyByDepartment.map((entry) => entry.count)), 1)) * 100, 8)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-state">No requests recorded for the selected date range.</p>
                )}
              </div>
            </div>
          </>
        )}

        <div className="panel-group">
          <div className="section-heading">
            <h2>Recent requests</h2>
            <span>{data.recent.length} latest</span>
          </div>
          <div className="panel-section recent-panel">
            <div className="recent-requests-scroll">
              <RequestRows
                requests={data.recent}
                onSelect={onRequestSelect}
                unreadRequestIds={unreadRequestIds}
              />
            </div>
          </div>
        </div>
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
      </>}
    </section>
  );
}

export default Dashboard;
