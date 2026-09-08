import { useEffect, useState } from "react";
import { adminFetch } from "../api/adminApi";
import { getTableCache, setTableCache } from "../utils/tableCache";
import "../styles/settings.css";

const fallbackRequestTypes = [
  "Hardware",
  "Software",
  "Network",
  "Account / Access",
  "Printer",
  "Other",
];

function AccountSettings() {
  const [account, setAccount] = useState(null);
  const [requestTypes, setRequestTypes] = useState(fallbackRequestTypes);
  const [form, setForm] = useState({ name: "", email: "", expertise: [], currentPassword: "", newPassword: "" });
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);


  useEffect(() => {
    const cachedAccount = getTableCache("/api/admin/account");
    const applyAccount = (user) => {
        setAccount(user);
        setForm((current) => ({
          ...current,
          name: user.name || "",
          email: user.email || "",
          expertise: Array.isArray(user.expertise) ? user.expertise : user.expertise ? [user.expertise] : [],
        }));
      };

    if (cachedAccount) {
      applyAccount(cachedAccount);
    } else {
      adminFetch("/api/admin/account")
        .then((user) => {
          setTableCache("/api/admin/account", user);
          applyAccount(user);
        })
      .catch((error) => setMessage(error.message));
    }

    const cachedSettings = getTableCache("/api/admin/settings");
    const applySettings = (settings) => {
      if (Array.isArray(settings?.requestTypes) && settings.requestTypes.length) {
        setRequestTypes(settings.requestTypes);
      }
    };

    if (cachedSettings) {
      applySettings(cachedSettings);
    } else {
      adminFetch("/api/admin/settings")
      .then((settings) => {
        setTableCache("/api/admin/settings", settings);
        applySettings(settings);
      })
      .catch(() => {
        setRequestTypes(fallbackRequestTypes);
      });
    }
  }, []);

  async function saveAccount(event) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    try {
      const updated = await adminFetch("/api/admin/account", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      setAccount(updated);
      setTableCache("/api/admin/account", updated);
      setForm((current) => ({ ...current, currentPassword: "", newPassword: "" }));
      setMessage("Account settings saved.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  if (!account) return <section className="admin-panel"><p className="empty-state">{message || "Loading account settings..."}</p></section>;

  return (
    <section className="admin-panel">
      <div className="panel-heading">
        <div><p className="home-eyebrow">Profile</p><h1>Account settings</h1></div>
      </div>
      <form className="account-settings-card" onSubmit={saveAccount}>
        <label>Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
        <label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label>
        <label>Current password<input type="password" value={form.currentPassword} onChange={(event) => setForm({ ...form, currentPassword: event.target.value })} required /></label>
        <label>New password <span className="field-hint">Leave blank to keep the current password.</span><input type="password" minLength="8" value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} /></label>
        {message && <p className="save-message">{message}</p>}
        <button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save account settings"}</button>
      </form>
    </section>
  );
}

export default AccountSettings;