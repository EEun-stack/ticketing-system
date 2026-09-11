import {
  getRequestDescription,
  getRequestTitle,
  getRequestTypeLabel,
} from "./requestDisplay";
import { statusLabels } from "./requestStatus";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
}

function getFilterSummary(filters = {}) {
  const entries = [
    ["Date from", filters.dateFrom],
    ["Date to", filters.dateTo],
    ["Unit", filters.unit],
    ["Name", filters.name],
    ["Status", statusLabels[filters.status] || filters.status],
    ["Nature", filters.requestType],
  ].filter(([, value]) => String(value || "").trim());

  if (!entries.length) return "All records";
  return entries
    .map(([label, value]) => `${label}: ${Array.isArray(value) ? value.join(", ") : value}`)
    .join(" | ");
}

function getRequestTypeGroup(request) {
  return request.requestType || "No request type";
}

function getAnalyticsHtml(analytics) {
  if (!analytics) return "";

  const statusRows = (analytics.statusOrder || Object.keys(analytics.statusCounts || {}))
    .map((status) => `
      <tr>
        <td>${escapeHtml(statusLabels[status] || status)}</td>
        <td>${escapeHtml(analytics.statusCounts?.[status] || 0)}</td>
      </tr>
    `)
    .join("");
  const adminRows = (analytics.adminActivity || [])
    .slice(0, 8)
    .map((admin) => `<tr><td>${escapeHtml(admin.name)}</td><td>${escapeHtml(admin.count)}</td></tr>`)
    .join("");
  const departmentRows = (analytics.monthlyByDepartment || [])
    .slice(0, 8)
    .map((department) => `<tr><td>${escapeHtml(department.department)}</td><td>${escapeHtml(department.count)}</td></tr>`)
    .join("");

  const table = (heading, firstColumn, rows, emptyText) => `
    <div class="analytics-table">
      <h3>${heading}</h3>
      ${rows ? `<table><thead><tr><th>${firstColumn}</th><th>Requests</th></tr></thead><tbody>${rows}</tbody></table>` : `<p>${emptyText}</p>`}
    </div>
  `;

  return `
    <section class="analytics-section">
      <h2>Analytics</h2>
      <p class="analytics-total">Total requests: <strong>${escapeHtml(analytics.total || 0)}</strong></p>
      <div class="analytics-grid">
        ${table("Requests by status", "Status", statusRows, "No status data available.")}
        ${adminRows ? table("Admin activity", "Admin", adminRows, "No admin activity recorded.") : ""}
        ${departmentRows ? table("Requests by department", "Department", departmentRows, "No department data available.") : ""}
      </div>
    </section>
  `;
}

function getReportHtml({ title, subtitle, filters, requests, analytics }) {
  const hasDescription = requests.some((request) => getRequestDescription(request));
  const requestGroups = requests.reduce((groups, request) => {
    const type = getRequestTypeGroup(request);
    const group = groups.get(type) || [];
    group.push(request);
    groups.set(type, group);
    return groups;
  }, new Map());

  function getRows(groupRequests) {
    return groupRequests
      .map((request) => {
        const description = getRequestDescription(request);
        const resolvedAt = request.status === "RESOLVED" && request.resolvedAt ? formatDate(request.resolvedAt) : "";

        return `
          <tr>
            <td>${escapeHtml(request.controlId || "—")}</td>
            <td>${escapeHtml(formatDate(request.createdAt))}</td>
            <td>${escapeHtml(request.employeeName)}</td>
            <td>${escapeHtml(request.department)}</td>
            <td>${escapeHtml(getRequestTypeLabel(request))}</td>
            <td>${escapeHtml(getRequestTitle(request))}</td>
            <td>${escapeHtml(statusLabels[request.status] || request.status)}</td>
            <td>${escapeHtml(request.statusUpdatedByName || "")}</td>
            <td>${escapeHtml(resolvedAt)}</td>
            ${hasDescription ? `<td>${escapeHtml(description)}</td>` : ""}
          </tr>
        `;
      })
      .join("");
  }

  function getTable(groupRequests) {
    return `
      <table>
        <thead>
          <tr>
            <th>Control ID</th>
            <th>Date</th>
            <th>Name</th>
            <th>Unit</th>
            <th>Nature</th>
            <th>Request</th>
            <th>Status</th>
            <th>Acted By</th>
            <th>Resolved At</th>
            ${hasDescription ? "<th>Description</th>" : ""}
          </tr>
        </thead>
        <tbody>${getRows(groupRequests)}</tbody>
      </table>
    `;
  }

  const groupedTables = [...requestGroups.entries()]
    .map(([type, groupRequests]) => `<section class="type-section"><h2>${escapeHtml(type)}</h2>${getTable(groupRequests)}</section>`)
    .join("");
  const tables = groupedTables || `<p class="empty-state">No requests matched these filters.</p>`;

  return `
    <!doctype html>
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          body { margin: 32px; color: #1f2933; font-family: Arial, sans-serif; }
          h1 { margin: 0 0 6px; font-size: 24px; }
          h2 { margin: 24px 0 8px; font-size: 16px; color: #243b53; }
          p { margin: 0 0 16px; color: #52616b; font-size: 12px; }
          .summary { margin-bottom: 18px; }
          .analytics-section { margin: 24px 0; break-inside: avoid; }
          .analytics-section h2 { margin-bottom: 8px; }
          .analytics-total { margin-bottom: 12px; }
          .analytics-grid { display: flex; gap: 18px; align-items: flex-start; }
          .analytics-table { flex: 1; min-width: 0; }
          .analytics-table h3 { margin: 0 0 6px; font-size: 13px; color: #243b53; }
          .analytics-table table { font-size: 10px; }
          .analytics-table th, .analytics-table td { padding: 5px 6px; }
          .type-section { break-inside: avoid; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th, td { padding: 8px; border: 1px solid #d9e2ec; text-align: left; vertical-align: top; }
          th { background: #f0f4f8; color: #243b53; }
          td:last-child { white-space: pre-wrap; }
          @media print {
            body { margin: 18mm; }
            .analytics-grid { display: grid; grid-template-columns: repeat(3, 1fr); }
          }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(subtitle || "")}</p>
        <p class="summary">${escapeHtml(getFilterSummary(filters))}</p>
        ${getAnalyticsHtml(analytics)}
        ${tables}
      </body>
    </html>
  `;
}

export function openReportWindow(title = "Request Report") {
  const reportWindow = window.open("", "_blank");
  if (!reportWindow) return null;

  reportWindow.document.open();
  reportWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          body { margin: 32px; color: #1f2933; font-family: Arial, sans-serif; }
          p { color: #52616b; }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <p>Preparing report...</p>
      </body>
    </html>
  `);
  reportWindow.document.close();
  return reportWindow;
}

export function exportRequestsPdf({ reportWindow, title, subtitle, filters, requests, analytics }) {
  const targetWindow = reportWindow || openReportWindow(title);
  if (!targetWindow) return false;

  targetWindow.document.open();
  targetWindow.document.write(getReportHtml({ title, subtitle, filters, requests, analytics }));
  targetWindow.document.close();

  targetWindow.setTimeout(() => {
    targetWindow.focus();
    targetWindow.print();
  }, 250);

  return true;
}
