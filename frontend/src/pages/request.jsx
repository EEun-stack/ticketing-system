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
  currentUserRole,
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
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(() => localStorage.getItem("requestFiltersVisible") !== "false");
  const [revertStatus, setRevertStatus] = useState("IN_PROGRESS");
  const [revertConfirmation, setRevertConfirmation] = useState("");
  const [isRevertModalOpen, setIsRevertModalOpen] = useState(false);
  const query = useMemo(() => getRequestQuery(filters), [filters]);
  const canRevertResolved = currentUserRole === "ADMIN";

  useEffect(() => {
    localStorage.setItem("requestFiltersVisible", String(showFilters));
  }, [showFilters]);

  useEffect(() => {
    adminFetch("/api/requests/settings")
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
    setIsLoading(true);
    const timeout = window.setTimeout(() => {
      adminFetch(`/api/admin/requests${query}`)
        .then(setRequests)
        .catch((error) => setMessage(error.message))
        .finally(() => setIsLoading(false));
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [query]);

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

  async function updateStatus(status, confirmation = "") {
    if (!selected || (selected.status === "RESOLVED" && !canEditResolved && !confirmation)) return;

    try {
      const updated = await adminFetch(`/api/admin/requests/${selected.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, ...(confirmation ? { confirmation } : {}) }),
      });
      setRequests((current) =>
        current.map((request) => (request.id === updated.id ? updated : request))
      );
      setSelected(updated);
      setIsRevertModalOpen(false);
      setRevertConfirmation("");
      onChange();
    } catch (error) {
      setMessage(error.message);
    }
  }

  function openRevertModal() {
    setRevertStatus("IN_PROGRESS");
    setRevertConfirmation("");
    setIsRevertModalOpen(true);
  }

  async function exportReport() {
    const reportWindow = openReportWindow("Request Report");
    if (!reportWindow) {
      setMessage("Please allow popups to export the PDF report.");
      return;
    }

    try {
      setMessage("");
      const filteredRequests = await adminFetch(`/api/admin/requests${query ? `${query}&scope=mine` : '?scope=mine'}`);
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
      {isLoading && <p className="loading-indicator" aria-live="polite">Loading requests...</p>}

      {showFilters && (
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
            multiple
            value={filters.requestType}
            onChange={(event) => updateFilter(
              "requestType",
              Array.from(event.target.selectedOptions, (option) => option.value),
            )}
          >
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
      )}

      <RequestRows
        requests={requests}
        onSelect={openRequest}
        unreadRequestIds={unreadRequestIds}
        isLoading={isLoading}
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
                Acted by {selected.statusUpdatedByName}
                {(selected.status === "RESOLVED" ? selected.resolvedAt : selected.statusUpdatedAt)
                  ? ` on ${new Date(selected.status === "RESOLVED" ? selected.resolvedAt : selected.statusUpdatedAt).toLocaleString()}`
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
              <>
                <p className="modal-lock-note">Resolved requests are locked.</p>
                {canRevertResolved && (
                  <button className="revert-request-button" type="button" onClick={openRevertModal}>
                    Revert
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
      {isRevertModalOpen && selected && (
        <div className="modal-backdrop revert-backdrop" role="presentation">
          <div className="request-modal revert-modal" role="dialog" aria-modal="true" aria-labelledby="revert-modal-title">
            <p className="home-eyebrow">Revert request</p>
            <h2 id="revert-modal-title">Move this request back to an open status?</h2>
            <p className="modal-lock-note">This action changes the resolved request and is recorded in the activity log.</p>
            <label className="modal-field">
              New status
              <select value={revertStatus} onChange={(event) => setRevertStatus(event.target.value)}>
                {Object.entries(statusLabels)
                  .filter(([value]) => value !== "RESOLVED")
                  .map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
              </select>
            </label>
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
                onClick={() => updateStatus(revertStatus, revertConfirmation)}
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

export default Requests;
