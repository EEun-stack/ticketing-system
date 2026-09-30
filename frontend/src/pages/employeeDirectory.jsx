import { useEffect, useRef, useState } from "react";
import { FaDownload, FaPenToSquare, FaPlus, FaTrash, FaUpload, FaXmark } from "react-icons/fa6";
import { adminFetch } from "../api/adminApi";
import "../styles/employeeDirectory.css";

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    if (row.some((value) => value.trim())) rows.push(row);
  }
  if (quoted) throw new Error("The CSV file contains an unfinished quoted value.");
  if (!rows.length) throw new Error("The CSV file is empty.");

  const normalizeHeader = (value) => value.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/[\s_-]/g, "");
  const headers = rows[0].map(normalizeHeader);
  const employeeIdIndex = headers.indexOf("employeeid");
  const nameIndex = headers.indexOf("fullname") >= 0 ? headers.indexOf("fullname") : headers.indexOf("name");
  const emailIndex = headers.indexOf("email");
  const unitIndex = headers.indexOf("unit");
  const statusIndex = headers.indexOf("status");
  if ([employeeIdIndex, nameIndex, emailIndex].some((index) => index < 0)) {
    throw new Error("Include Employee ID, Full Name, and Email columns in the CSV.");
  }

  return rows.slice(1).map((values) => {
    const status = statusIndex >= 0 ? (values[statusIndex] || "").trim().toLowerCase() : "";
    if (status && !["active", "inactive"].includes(status)) {
      throw new Error("Status values must be Active or Inactive.");
    }
    return {
      employeeId: values[employeeIdIndex] || "",
      name: values[nameIndex] || "",
      email: values[emailIndex] || "",
      ...(unitIndex >= 0 ? { unit: values[unitIndex] || "" } : {}),
      ...(status ? { isActive: status === "active" } : {}),
    };
  }).filter((employee) => employee.employeeId.trim() || employee.name.trim() || employee.email.trim());
}

function downloadCsvTemplate() {
  const blob = new Blob(["Employee ID,Full Name,Email,Unit,Status\r\n"], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "users-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function EmployeeDirectory() {
  const fileInput = useRef(null);
  const [employees, setEmployees] = useState([]);
  const [units, setUnits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);
  const [message, setMessage] = useState("");
  const [importErrors, setImportErrors] = useState([]);
  const emptyForm = { employeeId: "", name: "", email: "", unit: "", isActive: true };
  const [form, setForm] = useState(emptyForm);

  async function loadEmployees() {
    try {
      setEmployees(await adminFetch("/api/admin/employees"));
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isActive = true;
    adminFetch("/api/admin/employees")
      .then((nextEmployees) => {
        if (isActive) setEmployees(nextEmployees);
      })
      .catch((error) => {
        if (isActive) setMessage(error.message);
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });
    adminFetch("/api/admin/settings")
      .then((settings) => {
        if (isActive) {
          setUnits(Array.isArray(settings?.units) ? settings.units.map((unit) => String(unit).trim()).filter(Boolean) : []);
        }
      })
      .catch((error) => {
        if (isActive) setMessage(error.message);
      });
    return () => {
      isActive = false;
    };
  }, []);

  async function saveEmployee(event) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    const isEditing = Boolean(editingEmployeeId);
    try {
      await adminFetch(isEditing ? `/api/admin/employees/${editingEmployeeId}` : "/api/admin/employees", {
        method: isEditing ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      setEmployees(await adminFetch("/api/admin/employees"));
      setForm(emptyForm);
      setEditingEmployeeId(null);
      setIsAddOpen(false);
      setMessage(isEditing ? "User updated." : "User added.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  function openAddEmployee() {
    setEditingEmployeeId(null);
    setForm(emptyForm);
    setIsAddOpen(true);
  }

  function openEditEmployee(employee) {
    setEditingEmployeeId(employee.id);
    setForm({ employeeId: employee.employeeId, name: employee.name, email: employee.email, unit: employee.unit || "", isActive: employee.isActive });
    setIsAddOpen(true);
  }

  async function deleteEmployee(employee) {
    if (!window.confirm(`Delete ${employee.name} from the user directory?`)) return;
    setMessage("");
    try {
      await adminFetch(`/api/admin/employees/${employee.id}`, { method: "DELETE" });
      setEmployees((current) => current.filter((item) => item.id !== employee.id));
      setMessage("User deleted.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  const unitOptions = [...new Set([...units, form.unit].filter(Boolean))];

  async function importFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setMessage("");
    setImportErrors([]);

    try {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        throw new Error("Choose a CSV file exported from Excel.");
      }
      const rows = parseCsv(await file.text());
      if (!rows.length) throw new Error("The CSV file has no user rows.");
      if (rows.length > 5000) throw new Error("Import up to 5,000 users at a time.");

      setIsImporting(true);
      let created = 0;
      let updated = 0;
      const errors = [];
      for (let start = 0; start < rows.length; start += 100) {
        const result = await adminFetch("/api/admin/employees/import", {
          method: "POST",
          body: JSON.stringify({ employees: rows.slice(start, start + 100) }),
        });
        created += result.created;
        updated += result.updated;
        errors.push(...result.errors.map((item) => ({ ...item, row: item.row + start })));
      }
      await loadEmployees();
      setImportErrors(errors);
      setMessage(`Import complete: ${created} added, ${updated} updated, ${errors.length} skipped.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <section className="admin-panel employee-directory-panel">
      <div className="panel-heading">
        <div>
          <p className="home-eyebrow">Employee access</p>
          <h1>Users</h1>
        </div>
        <div className="panel-actions">
          <button className="secondary-button" type="button" onClick={downloadCsvTemplate}>
            <FaDownload aria-hidden="true" />
            CSV Template
          </button>
          <input
            ref={fileInput}
            className="employee-file-input"
            type="file"
            accept=".csv,text/csv"
            onChange={importFile}
            aria-label="Import users from CSV"
          />
          <button className="secondary-button" type="button" onClick={() => fileInput.current?.click()} disabled={isImporting}>
            <FaUpload aria-hidden="true" />
            {isImporting ? "Importing..." : "Import CSV"}
          </button>
          <button className="primary-button" type="button" onClick={openAddEmployee}>
            <FaPlus aria-hidden="true" />
            Add User
          </button>
        </div>
      </div>

      {message && <p className="save-message" role="status">{message}</p>}
      {isLoading && <p className="loading-indicator" aria-live="polite">Loading users...</p>}
      {importErrors.length > 0 && (
        <ul className="employee-import-errors" aria-label="Import row errors">
          {importErrors.slice(0, 8).map((error, index) => (
            <li key={`${error.row}-${index}`}>Row {error.row}: {error.message}</li>
          ))}
          {importErrors.length > 8 && <li>And {importErrors.length - 8} more skipped rows.</li>}
        </ul>
      )}

      {isAddOpen && (
        <div className="modal-backdrop" role="presentation" onClick={(event) => {
          if (event.target === event.currentTarget) setIsAddOpen(false);
        }}>
          <div className="modal-card employee-modal-card" role="dialog" aria-modal="true" aria-labelledby="add-user-title">
            <div className="modal-header">
              <div>
                <p className="home-eyebrow">Employee access</p>
                <h2 id="add-user-title">{editingEmployeeId ? "Edit User" : "Add User"}</h2>
              </div>
              <button className="icon-button" type="button" onClick={() => setIsAddOpen(false)} aria-label="Close user form" title="Close">
                <FaXmark />
              </button>
            </div>
            <form className="user-form employee-form" onSubmit={saveEmployee}>
              <label>
                Employee ID
                <input name="employeeId" type="text" maxLength="64" value={form.employeeId} onChange={(event) => setForm({ ...form, employeeId: event.target.value })} required />
              </label>
              <label>
                Full Name
                <input name="name" type="text" maxLength="160" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
              </label>
              <label>
                Email
                <input name="email" type="email" maxLength="254" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
              </label>
              <label>
                Unit
                <select name="unit" value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })}>
                  <option value="">Select unit</option>
                  {unitOptions.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                </select>
              </label>
              <label>
                Status
                <select name="isActive" value={form.isActive ? "active" : "inactive"} onChange={(event) => setForm({ ...form, isActive: event.target.value === "active" })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
              <div className="user-form-actions">
                <button className="secondary-button" type="button" onClick={() => setIsAddOpen(false)}>Cancel</button>
                <button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? "Saving..." : editingEmployeeId ? "Save Changes" : "Add User"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="user-table-wrap">
        <table className="user-table employee-directory-table">
          <thead>
            <tr><th>Employee ID</th><th>Full Name</th><th>Email</th><th>Unit</th><th>Created</th><th>Last Request</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id}>
                <td>{employee.employeeId}</td>
                <td>{employee.name}</td>
                <td>{employee.email}</td>
                <td>{employee.unit || "—"}</td>
                <td>{new Date(employee.createdAt).toLocaleDateString()}</td>
                <td>{employee.lastRequestAt ? new Date(employee.lastRequestAt).toLocaleDateString() : "Never"}</td>
                <td><span className={`account-status ${employee.isActive ? "active" : "inactive"}`}>{employee.isActive ? "Active" : "Inactive"}</span></td>
                <td>
                  <div className="user-action-group">
                    <button className="icon-button" type="button" onClick={() => openEditEmployee(employee)} aria-label={`Edit ${employee.name}`} title="Edit user">
                      <FaPenToSquare />
                    </button>
                    <button className="icon-button danger" type="button" onClick={() => deleteEmployee(employee)} aria-label={`Delete ${employee.name}`} title="Delete user">
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && employees.length === 0 && (
              <tr><td colSpan="8">No users in the directory yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default EmployeeDirectory;