import { useEffect, useMemo, useState } from "react";
import { FaFilePdf, FaXmark } from "react-icons/fa6";
import { adminFetch } from "../api/adminApi";
import RequestRows from "../components/requestRows";
import {
  getRequestDescription,
  getRequestTitle,
  getRequestTypeLabel,
} from "../utils/requestDisplay";
import { emptyRequestFilters, getRequestQuery } from "../utils/requestFilters";
import { exportRequestsPdf, openReportWindow } from "../utils/reportExport";
import { statusLabels } from "../utils/requestStatus";
import "../styles/request.css";

function Requests({
  canEditResolved = false,
  onChange,
  onNotificationTargetHandled,
  onRequestViewed,
  selectedRequestId,
  unreadRequestIds,
}) {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState(emptyRequestFilters);
  const [settings, setSettings] = useState({ units: [], requestTypes: [] });
  const query = useMemo(() => getRequestQuery(filters), [filters]);

  useEffect(() => {
    adminFetch("/api/admin/settings")
      .then((nextSettings) =>
        setSettings({
          units: Array.isArray(nextSettings.units) ? nextSettings.units : [],
          requestTypes: Array.isArray(nextSettings.requestTypes)
            ? nextSettings.requestTypes
            : [],
        })
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    adminFetch(`/api/admin/requests${query}`)
      .then(setRequests)
      .catch((error) => setMessage(error.message));
  }, [onChange, query]);

  useEffect(() => {
    if (!selectedRequestId || !requests.length) return;

    const request = requests.find((item) => item.id === selectedRequestId);
    if (!request) return;

    setSelected(request);
    onRequestViewed?.(request.id);
    onNotificationTargetHandled?.();
  }, [onNotificationTargetHandled, onRequestViewed, requests, selectedRequestId]);

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function clearFilters() {
    setFilters(emptyRequestFilters);
  }

  function openRequest(request) {
    setSelected(request);
    onRequestViewed?.(request.id);
  }

  async function updateStatus(status) {
    if (!selected || (selected.status === "RESOLVED" && !canEditResolved)) return;

    try {
      const updated = await adminFetch(`/api/admin/requests/${selected.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setRequests((current) =>
        current.map((request) => (request.id === updated.id ? updated : request))
      );
      setSelected(updated);
      onChange();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function exportReport() {
    const reportWindow = openReportWindow("Request Report");
    if (!reportWindow) {
      setMessage("Please allow popups to export the PDF report.");
      return;
    }

    try {
      setMessage("");
      const filteredRequests = await adminFetch(`/api/admin/requests${query}`);
      exportRequestsPdf({
        reportWindow,
        title: "Request Report",
        subtitle: `Generated ${new Date().toLocaleString()}`,
        filters,
        requests: filteredRequests,
      });
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="admin-panel">
      <div className="panel-heading">
        <div>
          <p className="home-eyebrow">Work queue</p>
          <h1>Requests</h1>
        </div>
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
      {message && <p className="error-message">{message}</p>}

      <div className="filter-bar request-filter-bar" aria-label="Request filters">
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
          Name
          <input
            type="search"
            value={filters.name}
            onChange={(event) => updateFilter("name", event.target.value)}
            placeholder="Employee name"
          />
        </label>
        <label>
          Unit
          <select
            value={filters.unit}
            onChange={(event) => updateFilter("unit", event.target.value)}
          >
            <option value="">All units</option>
            {settings.units.map((unit) => (
              <option value={unit} key={unit}>
                {unit}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select
            value={filters.status}
            onChange={(event) => updateFilter("status", event.target.value)}
          >
            <option value="">All statuses</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Type
          <select
            value={filters.requestType}
            onChange={(event) => updateFilter("requestType", event.target.value)}
          >
            <option value="">All types</option>
            {settings.requestTypes.map((type) => (
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

      <RequestRows
        requests={requests}
        onSelect={openRequest}
        unreadRequestIds={unreadRequestIds}
      />
      {selected && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setSelected(null)}
        >
          <div
            className="request-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="request-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close icon-button"
              type="button"
              onClick={() => setSelected(null)}
              aria-label="Close request details"
            >
              <FaXmark />
            </button>
            <p className="home-eyebrow">Request details</p>
            <h2 id="request-modal-title">{getRequestTitle(selected)}</h2>
            <p className="modal-meta">
              {selected.employeeName} - {selected.department} -{" "}
              {getRequestTypeLabel(selected)} -{" "}
              {new Date(selected.createdAt).toLocaleString()}
            </p>
            {getRequestDescription(selected) && (
              <p className="modal-description">{getRequestDescription(selected)}</p>
            )}
            {selected.statusUpdatedByName && (
              <p className="modal-audit">
                Last updated by {selected.statusUpdatedByName}
                {selected.statusUpdatedAt
                  ? ` on ${new Date(selected.statusUpdatedAt).toLocaleString()}`
                  : ""}
              </p>
            )}
            <label className="modal-field">
              Status
              <select
                value={selected.status}
                onChange={(event) => updateStatus(event.target.value)}
                disabled={selected.status === "RESOLVED" && !canEditResolved}
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            {selected.status === "RESOLVED" && !canEditResolved && (
              <p className="modal-lock-note">Resolved requests are final.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export default Requests;
