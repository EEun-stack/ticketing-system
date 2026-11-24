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
  const userLoginActivity = Array.isArray(analytics.monthlyUserActivity)
    ? analytics.monthlyUserActivity.map((item) => ({
      month: new Date(`${item.month}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }),
      logins: Math.max(Number(item.logins) || 0, 0),
    }))
    : null;

  const table = (heading, firstColumn, rows, emptyText, valueHeading = "Requests") => `
    <div class="analytics-card">
      <h3>${heading}</h3>
      ${rows ? `<table><thead><tr><th>${firstColumn}</th><th>${valueHeading}</th></tr></thead><tbody>${rows}</tbody></table>` : `<p>${emptyText}</p>`}
    </div>
  `;

  let userLoginSection = "";
  if (userLoginActivity) {
    const userLoginYear = Number(analytics.monthlyUserActivityYear) || new Date().getUTCFullYear();
    const userLoginTotal = userLoginActivity.reduce((sum, item) => sum + item.logins, 0);
    const maxMonthlyLogins = Math.max(...userLoginActivity.map((item) => item.logins), 1);
    const monthBars = userLoginActivity.map((item) => {
      const height = item.logins ? Math.max((item.logins / maxMonthlyLogins) * 100, 4) : 0;
      return `
        <div class="login-month">
          <strong>${escapeHtml(item.logins)}</strong>
          <div class="login-bar-track"><span class="login-bar" style="height:${height}%"></span></div>
          <span>${escapeHtml(item.month)}</span>
        </div>
      `;
    }).join("");

    userLoginSection = `
      <section class="user-login-report">
        <div class="login-report-heading">
          <div>
            <h3>Monthly user sign-ins</h3>
            <p>Successful employee accounts only · ${escapeHtml(userLoginYear)}</p>
          </div>
          <div class="login-total-card">
            <span>Total sign-ins</span>
            <strong>${escapeHtml(userLoginTotal)}</strong>
          </div>
        </div>
        <div class="login-month-grid">${monthBars}</div>
      </section>
    `;
  }

  return `
    <section class="analytics-section">
      <h2>Analytics</h2>
      <div class="analytics-total">
        <span>Requests in report</span>
        <strong>${escapeHtml(analytics.total || 0)}</strong>
      </div>
      <div class="analytics-grid">
        ${table("Requests by status", "Status", statusRows, "No status data available.", "Requests")}
        ${adminRows ? table("Admin activity", "Admin", adminRows, "No admin activity recorded.", "Actions") : ""}
        ${departmentRows ? table("Requests by department", "Department", departmentRows, "No department data available.", "Requests") : ""}
      </div>
      ${userLoginSection}
    </section>
  `;
}

function getReportHtml({ title, subtitle, filters, requests, analytics }) {
  const dashboardReport = Array.isArray(analytics?.monthlyUserActivity);
  const pageRule = dashboardReport ? "@page { size: landscape; margin: 12mm; }" : "@page { margin: 14mm; }";
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
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          ${pageRule}
          * { box-sizing: border-box; }
          body { margin: 0; padding: 24px; color: #182b45; background: #edf2f7; font-family: Arial, sans-serif; }
          .report { max-width: 1200px; margin: 0 auto; padding: 34px; background: #fff; box-shadow: 0 12px 36px rgba(23, 42, 69, 0.12); }
          .report-header { display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; padding-bottom: 20px; border-bottom: 3px solid #c9a13b; }
          .brand-line { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; color: #52657d; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; }
          .brand-mark { display: grid; width: 34px; height: 34px; place-items: center; border-radius: 8px; color: #fff; background: #17365d; font-size: 12px; letter-spacing: 0; }
          h1 { margin: 0; color: #17365d; font-size: 26px; line-height: 1.2; }
          h2 { margin: 0 0 12px; color: #17365d; font-size: 18px; }
          h3 { margin: 0 0 10px; color: #17365d; font-size: 13px; }
          p { margin: 0; color: #65758b; font-size: 11px; line-height: 1.5; }
          .generated { max-width: 240px; color: #65758b; font-size: 10px; text-align: right; }
          .generated strong { display: block; margin-top: 5px; color: #293d58; font-size: 11px; font-weight: 600; }
          .summary { display: flex; gap: 12px; align-items: baseline; margin-top: 18px; padding: 11px 14px; border: 1px solid #e0e7ef; border-radius: 8px; background: #f7f9fc; color: #41536b; font-size: 10px; }
          .summary-label { flex: 0 0 auto; color: #738399; font-size: 9px; font-weight: 700; letter-spacing: 0.08em; }
          .analytics-section { margin: 24px 0 28px; }
          .analytics-total { display: flex; justify-content: space-between; align-items: center; margin: 0 0 14px; padding: 12px 15px; border-radius: 8px; color: #fff; background: #17365d; font-size: 11px; }
          .analytics-total strong { font-size: 20px; }
          .analytics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 12px; align-items: start; }
          .analytics-card { min-width: 0; padding: 14px; border: 1px solid #e0e7ef; border-radius: 9px; background: #fff; break-inside: avoid; }
          .analytics-card table { font-size: 10px; }
          .analytics-card th, .analytics-card td { padding: 6px 7px; }
          .user-login-report { margin-top: 16px; padding: 16px; border: 1px solid #e0e7ef; border-radius: 10px; background: #f8fafc; break-inside: avoid; }
          .login-report-heading { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 14px; }
          .login-report-heading h3 { margin-bottom: 4px; font-size: 14px; }
          .login-total-card { min-width: 128px; padding: 9px 13px; border-radius: 8px; color: #fff; background: #17365d; text-align: right; }
          .login-total-card span { display: block; color: #dce5ef; font-size: 9px; }
          .login-total-card strong { display: block; margin-top: 3px; font-size: 19px; }
          .login-month-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 7px; align-items: end; }
          .login-month { display: grid; grid-template-rows: auto 72px auto; gap: 5px; min-width: 0; text-align: center; }
          .login-month strong { color: #243b53; font-size: 10px; }
          .login-bar-track { display: flex; align-items: flex-end; overflow: hidden; border-radius: 5px; background: #e8edf4; }
          .login-bar { display: block; width: 100%; border-radius: 5px 5px 0 0; background: linear-gradient(180deg, #d8b54c, #a87d17); }
          .login-month > span { color: #65758b; font-size: 9px; }
          .type-section { margin-top: 18px; }
          .type-section h2 { margin-bottom: 8px; padding-bottom: 7px; border-bottom: 1px solid #e0e7ef; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; table-layout: auto; font-size: 9px; }
          th, td { padding: 7px; border: 1px solid #d9e2ec; text-align: left; vertical-align: top; overflow-wrap: anywhere; }
          th { color: #243b53; background: #edf2f7; font-weight: 700; }
          td:last-child { white-space: pre-wrap; }
          .empty-state { padding: 14px; border: 1px dashed #cbd5e1; border-radius: 8px; text-align: center; }
          @media screen and (max-width: 760px) {
            body { padding: 0; }
            .report { padding: 20px; }
            .report-header { flex-direction: column; }
            .generated { text-align: left; }
            .login-month-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); }
          }
          @media print {
            body { padding: 0; background: #fff; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .report { max-width: none; padding: 0; box-shadow: none; }
            .analytics-section { break-inside: auto; }
            .user-login-report, .analytics-card { break-inside: avoid; }
            .type-section { break-inside: auto; }
            .type-section h2 { break-after: avoid; }
            thead { display: table-header-group; }
            tr { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <main class="report">
          <header class="report-header">
            <div>
              <div class="brand-line"><span class="brand-mark">FTI</span><span>FTI TICKETING SYSTEM</span></div>
              <h1>${escapeHtml(title)}</h1>
            </div>
            <div class="generated"><span>Generated</span><strong>${escapeHtml(subtitle || "")}</strong></div>
          </header>
          <div class="summary"><span class="summary-label">REQUEST FILTERS</span><span>${escapeHtml(getFilterSummary(filters))}</span></div>
          ${getAnalyticsHtml(analytics)}
          <section class="request-section">
            <h2>Requests</h2>
            ${tables}
          </section>
        </main>
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
