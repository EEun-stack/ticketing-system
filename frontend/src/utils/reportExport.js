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

function getReportHtml({ title, subtitle, filters, requests }) {
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
          .type-section { break-inside: avoid; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th, td { padding: 8px; border: 1px solid #d9e2ec; text-align: left; vertical-align: top; }
          th { background: #f0f4f8; color: #243b53; }
          td:last-child { white-space: pre-wrap; }
          @media print {
            body { margin: 18mm; }
          }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(subtitle || "")}</p>
        <p class="summary">${escapeHtml(getFilterSummary(filters))}</p>
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

export function exportRequestsPdf({ reportWindow, title, subtitle, filters, requests }) {
  const targetWindow = reportWindow || openReportWindow(title);
  if (!targetWindow) return false;

  targetWindow.document.open();
  targetWindow.document.write(getReportHtml({ title, subtitle, filters, requests }));
  targetWindow.document.close();

  targetWindow.setTimeout(() => {
    targetWindow.focus();
    targetWindow.print();
  }, 250);

  return true;
}
