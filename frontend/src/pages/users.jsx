import { useEffect, useState } from "react";
import { FaPlus, FaTrash, FaXmark } from "react-icons/fa6";
import { adminFetch } from "../api/adminApi";
import "../styles/users.css";

function Users() {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    email: "",
    name: "",
    password: "",
    confirmPassword: "",
  });

  function loadUsers() {
    adminFetch("/api/admin/users")
      .then(setUsers)
      .catch((error) => setMessage(error.message));
  }

  useEffect(() => {
    loadUsers();
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
          password: userForm.password,
        }),
      });
      setUsers((current) => [user, ...current]);
      setUserForm({ email: "", name: "", password: "", confirmPassword: "" });
      setIsAddModalOpen(false);
      setMessage("Admin user added.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSaving(false);
    }
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

      <div className="user-table-wrap">
        <table className="user-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.length ? (
              users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name || user.email?.split("@")[0] || "Admin"}</td>
                  <td>{user.email}</td>
                  <td>{new Date(user.createdAt).toLocaleString()}</td>
                  <td>
                    <button
                      className="icon-button danger"
                      type="button"
                      onClick={() => deleteUser(user.id)}
                      aria-label={`Delete ${user.name || user.email}`}
                      title="Delete admin user"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">No admin users yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default Users;
