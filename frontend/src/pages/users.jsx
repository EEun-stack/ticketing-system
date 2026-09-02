import { useEffect, useState } from "react";
import { FaPenToSquare, FaPlus, FaTrash, FaXmark } from "react-icons/fa6";
import { adminFetch } from "../api/adminApi";
import "../styles/users.css";

const fallbackRequestTypes = [
  "Hardware",
  "Software",
  "Network",
  "Account / Access",
  "Printer",
  "Other",
];

function normalizeExpertiseList(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
}

function Users() {
  const [users, setUsers] = useState([]);
  const [requestTypes, setRequestTypes] = useState(fallbackRequestTypes);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userForm, setUserForm] = useState({
    email: "",
    name: "",
    expertise: [],
    password: "",
    confirmPassword: "",
  });

  function toggleExpertise(type) {
    setUserForm((current) => {
      const selected = normalizeExpertiseList(current.expertise);
      const nextValue = selected.includes(type)
        ? selected.filter((item) => item !== type)
        : [...selected, type];
      return { ...current, expertise: nextValue };
    });
  }

  function loadUsers() {
    setIsLoadingUsers(true);
    const timeout = window.setTimeout(() => {
      adminFetch("/api/admin/users")
        .then(setUsers)
        .catch((error) => setMessage(error.message))
        .finally(() => setIsLoadingUsers(false));
    }, 3000);

    return timeout;
  }

  useEffect(() => {
    const usersTimer = loadUsers();
    const settingsTimer = window.setTimeout(() => {
      adminFetch("/api/admin/settings")
        .then((settings) => {
          if (Array.isArray(settings?.requestTypes) && settings.requestTypes.length) {
            setRequestTypes(settings.requestTypes);
          }
        })
        .catch(() => {
          setRequestTypes(fallbackRequestTypes);
        });
    }, 3000);

    return () => {
      window.clearTimeout(usersTimer);
      window.clearTimeout(settingsTimer);
    };
  }, []);

  async function addUser(event) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    if (userForm.password !== userForm.confirmPassword) {
      setMessage("Passwords do not match.");
      setIsSaving(false);
      return;
    }

    try {
      const user = await adminFetch("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          name: userForm.name,
          email: userForm.email,
          expertise: normalizeExpertiseList(userForm.expertise),
          password: userForm.password,
        }),
      });
      setUsers((current) => [user, ...current]);
      setUserForm({ email: "", name: "", expertise: [], password: "", confirmPassword: "" });
      setIsAddModalOpen(false);
      setMessage("Admin user added.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function updateUser(event) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    if (userForm.password && userForm.password !== userForm.confirmPassword) {
      setMessage("Passwords do not match.");
      setIsSaving(false);
      return;
    }

    try {
      const updatedUser = await adminFetch(`/api/admin/users/${editingUserId}`, {
        method: "PUT",
        body: JSON.stringify({
          name: userForm.name,
          email: userForm.email,
          expertise: normalizeExpertiseList(userForm.expertise),
          password: userForm.password || "",
        }),
      });

      setUsers((current) =>
        current.map((user) => (user.id === editingUserId ? { ...user, ...updatedUser } : user)),
      );
      setUserForm({ email: "", name: "", expertise: [], password: "", confirmPassword: "" });
      setEditingUserId(null);
      setIsEditModalOpen(false);
      setMessage("Admin account updated.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  function openEditUser(user) {
    setEditingUserId(user.id);
    setUserForm({
      email: user.email || "",
      name: user.name || "",
      expertise: Array.isArray(user.expertise) ? user.expertise : user.expertise ? [user.expertise] : [],
      password: "",
      confirmPassword: "",
    });
    setIsEditModalOpen(true);
  }

  async function deleteUser(userId) {
    const shouldDelete = window.confirm("Delete this admin user?");
    if (!shouldDelete) return;

    try {
      setMessage("");
      await adminFetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      setUsers((current) => current.filter((user) => user.id !== userId));
      setMessage("Admin user deleted.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="admin-panel">
      <div className="panel-heading">
        <div>
          <p className="home-eyebrow">Access control</p>
          <h1>Admin Users</h1>
        </div>
        <button
          className="primary-button"
          type="button"
          onClick={() => setIsAddModalOpen(true)}
        >
          <FaPlus />
          Add Admin
        </button>
      </div>

      {message && <p className="save-message">{message}</p>}
      {isLoadingUsers && <p className="loading-indicator" aria-live="polite">Loading admin users...</p>}

      {isAddModalOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsAddModalOpen(false);
          }}
        >
          <div className="modal-card user-modal-card" role="dialog" aria-modal="true" aria-labelledby="add-admin-title">
            <div className="modal-header">
              <div>
                <p className="home-eyebrow">New admin</p>
                <h2 id="add-admin-title">Add Admin</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close add admin form"
                title="Close"
              >
                <FaXmark />
              </button>
            </div>

            <form className="user-form user-form-modal" onSubmit={addUser}>
              <label>
                Name
                <input
                  name="name"
                  type="text"
                  value={userForm.name}
                  onChange={(event) =>
                    setUserForm({ ...userForm, name: event.target.value })
                  }
                  autoComplete="off"
                  required
                />
              </label>
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  value={userForm.email}
                  onChange={(event) =>
                    setUserForm({ ...userForm, email: event.target.value })
                  }
                  autoComplete="off"
                  required
                />
              </label>
              <label>
                Expertise
                <div className="expertise-picker">
                  {requestTypes.map((type) => (
                    <label className="expertise-option" key={type}>
                      <input
                        type="checkbox"
                        checked={Array.isArray(userForm.expertise) && userForm.expertise.includes(type)}
                        onChange={() => toggleExpertise(type)}
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  value={userForm.password}
                  onChange={(event) =>
                    setUserForm({ ...userForm, password: event.target.value })
                  }
                  autoComplete="new-password"
                  minLength="8"
                  required
                />
              </label>
              <label>
                Confirm Password
                <input
                  name="confirmPassword"
                  type="password"
                  value={userForm.confirmPassword}
                  onChange={(event) =>
                    setUserForm({ ...userForm, confirmPassword: event.target.value })
                  }
                  autoComplete="new-password"
                  minLength="8"
                  required
                />
              </label>
              <div className="user-form-actions">
                <button className="secondary-button" type="button" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button className="primary-button" type="submit" disabled={isSaving}>
                  {isSaving ? "Adding..." : "Add Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsEditModalOpen(false);
              setEditingUserId(null);
            }
          }}
        >
          <div className="modal-card user-modal-card" role="dialog" aria-modal="true" aria-labelledby="edit-admin-title">
            <div className="modal-header">
              <div>
                <p className="home-eyebrow">Edit admin</p>
                <h2 id="edit-admin-title">Edit Admin</h2>
              </div>
              <button
                className="icon-button"
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingUserId(null);
                }}
                aria-label="Close edit admin form"
                title="Close"
              >
                <FaXmark />
              </button>
            </div>

            <form className="user-form user-form-modal" onSubmit={updateUser}>
              <label>
                Name
                <input
                  name="name"
                  type="text"
                  value={userForm.name}
                  onChange={(event) =>
                    setUserForm({ ...userForm, name: event.target.value })
                  }
                  autoComplete="off"
                  required
                />
              </label>
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  value={userForm.email}
                  onChange={(event) =>
                    setUserForm({ ...userForm, email: event.target.value })
                  }
                  autoComplete="off"
                  required
                />
              </label>
              <label>
                Expertise
                <div className="expertise-picker">
                  {requestTypes.map((type) => (
                    <label className="expertise-option" key={type}>
                      <input
                        type="checkbox"
                        checked={Array.isArray(userForm.expertise) && userForm.expertise.includes(type)}
                        onChange={() => toggleExpertise(type)}
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
              </label>
              <label>
                New Password
                <input
                  name="password"
                  type="password"
                  value={userForm.password}
                  onChange={(event) =>
                    setUserForm({ ...userForm, password: event.target.value })
                  }
                  autoComplete="new-password"
                  minLength="8"
                  placeholder="Leave blank to keep current password"
                />
              </label>
              <label>
                Confirm New Password
                <input
                  name="confirmPassword"
                  type="password"
                  value={userForm.confirmPassword}
                  onChange={(event) =>
                    setUserForm({ ...userForm, confirmPassword: event.target.value })
                  }
                  autoComplete="new-password"
                  minLength="8"
                  placeholder="Leave blank to keep current password"
                />
              </label>
              <div className="user-form-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingUserId(null);
                  }}
                >
                  Cancel
                </button>
                <button className="primary-button" type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="user-table-wrap">
        <table className="user-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Expertise</th>
              <th>Created</th>
              <th>Last Login</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {!isLoadingUsers && users.length ? (
              users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name || user.email?.split("@")[0] || "Admin"}</td>
                  <td>{user.email}</td>
                  <td>{Array.isArray(user.expertise) && user.expertise.length ? user.expertise.join(", ") : "—"}</td>
                  <td>{new Date(user.createdAt).toLocaleString()}</td>
                  <td>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}</td>
                  <td>
                    <div className="user-action-group">
                      <button
                        className="icon-button"
                        type="button"
                        onClick={() => openEditUser(user)}
                        aria-label={`Edit ${user.name || user.email}`}
                        title="Edit admin user"
                      >
                        <FaPenToSquare />
                      </button>
                      <button
                        className="icon-button danger"
                        type="button"
                        onClick={() => deleteUser(user.id)}
                        aria-label={`Delete ${user.name || user.email}`}
                        title="Delete admin user"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : !isLoadingUsers ? (
              <tr>
                <td colSpan="6">No admin users yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default Users;
