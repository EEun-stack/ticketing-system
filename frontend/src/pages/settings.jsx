import { useEffect, useState } from "react";
import { FaBell, FaDatabase, FaDownload, FaEnvelope, FaMobileScreenButton, FaPlus, FaShapes, FaTrash, FaWpforms } from "react-icons/fa6";
import { adminFetch } from "../api/adminApi";
import { getAuthToken } from "../services/authStorage";
import { apiUrl } from "../api/config";
import "../styles/settings.css";

const asList = (value) => (Array.isArray(value) ? value : []);

function Settings({ requestNotifications }) {
  const [settings, setSettings] = useState(null);
  const [message, setMessage] = useState("");
  const [activeSection, setActiveSection] = useState("form");
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => requestNotifications?.notificationsEnabled ?? localStorage.getItem("desktopNotificationsEnabled") !== "false"
  );
  const [systemInfo, setSystemInfo] = useState(null);
  const [backupMessage, setBackupMessage] = useState("");

  const settingSections = [
    { id: "notifications", label: "Notifications", icon: FaBell },
    { id: "form", label: "Form", icon: FaWpforms },
    { id: "categories", label: "Categories", icon: FaShapes },
    { id: "database", label: "Database", icon: FaDatabase },
    { id: "email", label: "Email", icon: FaEnvelope },
    { id: "sms", label: "SMS", icon: FaMobileScreenButton },
  ];

  function selectSection(sectionId) {
    setActiveSection(sectionId);
  }

  useEffect(() => {
    adminFetch("/api/admin/settings")
      .then(setSettings)
      .catch((error) => setMessage(error.message));
  }, []);

  useEffect(() => {
    adminFetch("/api/admin/system-info")
      .then(setSystemInfo)
      .catch(() => {});
  }, []);

  function toggleNotifications(event) {
    const enabled = event.target.checked;
    setNotificationsEnabled(enabled);
    localStorage.setItem("desktopNotificationsEnabled", String(enabled));
    if (enabled !== requestNotifications?.notificationsEnabled) requestNotifications?.toggleNotifications();
  }

  async function downloadBackup() {
    setBackupMessage("Preparing backup...");
    try {
      const response = await fetch(`${apiUrl}/api/admin/database-backup`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Unable to create backup.");
      }
      const blobUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `ticketing-backup-${new Date().toISOString().slice(0, 10)}.sql`;
      link.click();
      URL.revokeObjectURL(blobUrl);
      setBackupMessage("Backup downloaded.");
    } catch (error) {
      setBackupMessage(error.message);
    }
  }

  if (!settings) {
    return (
      <section className="admin-panel">
        <p className="empty-state">{message || "Loading settings..."}</p>
      </section>
    );
  }

  const requestTypeOptions =
    settings.requestTypeOptions && typeof settings.requestTypeOptions === "object"
      ? settings.requestTypeOptions
      : {};

  function updateList(key, index, value) {
    setSettings({
      ...settings,
      [key]: asList(settings[key]).map((item, itemIndex) =>
        itemIndex === index ? value : item
      ),
    });
  }

  function addOption(key) {
    setSettings({ ...settings, [key]: [...asList(settings[key]), ""] });
  }

  function removeOption(key, index) {
    setSettings({
      ...settings,
      [key]: asList(settings[key]).filter((_, itemIndex) => itemIndex !== index),
    });
  }

  function updateRequestType(index, value) {
    const oldValue = asList(settings.requestTypes)[index];
    const nextOptions = { ...requestTypeOptions };

    if (oldValue !== value) {
      nextOptions[value] = asList(nextOptions[oldValue]);
      delete nextOptions[oldValue];
    }

    setSettings({
      ...settings,
      requestTypes: asList(settings.requestTypes).map((item, itemIndex) =>
        itemIndex === index ? value : item
      ),
      requestTypeOptions: nextOptions,
    });
  }

  function addRequestType() {
    setSettings({
      ...settings,
      requestTypes: [...asList(settings.requestTypes), ""],
      requestTypeOptions: { ...requestTypeOptions, "": [] },
    });
  }

  function removeRequestType(index) {
    const type = asList(settings.requestTypes)[index];
    const nextOptions = { ...requestTypeOptions };
    delete nextOptions[type];

    setSettings({
      ...settings,
      requestTypes: asList(settings.requestTypes).filter(
        (_, itemIndex) => itemIndex !== index
      ),
      requestTypeOptions: nextOptions,
    });
  }

  function updateRequestTypeOption(type, index, value) {
    setSettings({
      ...settings,
      requestTypeOptions: {
        ...requestTypeOptions,
        [type]: asList(requestTypeOptions[type]).map((item, itemIndex) =>
          itemIndex === index ? value : item
        ),
      },
    });
  }

  function addRequestTypeOption(type) {
    setSettings({
      ...settings,
      requestTypeOptions: {
        ...requestTypeOptions,
        [type]: [...asList(requestTypeOptions[type]), ""],
      },
    });
  }

  function removeRequestTypeOption(type, index) {
    setSettings({
      ...settings,
      requestTypeOptions: {
        ...requestTypeOptions,
        [type]: asList(requestTypeOptions[type]).filter(
          (_, itemIndex) => itemIndex !== index
        ),
      },
    });
  }

  async function saveSettings(event) {
    event.preventDefault();
    try {
      const requestTypes = asList(settings.requestTypes);
      const normalizedOptions = Object.fromEntries(
        requestTypes.map((type) => [type, asList(requestTypeOptions[type])])
      );

      await adminFetch("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({
          ...settings,
          units: asList(settings.units),
          requestTypes,
          requestTypeOptions: normalizedOptions,
        }),
      });
      setMessage("Settings saved.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="admin-panel">
      <div className="panel-heading">
        <div>
          <p className="home-eyebrow">Superadmin experience</p>
          <h1>Settings</h1>
        </div>
      </div>
      <div className="settings-layout">
        <nav className="settings-sidebar" aria-label="Settings sections">
          {settingSections.map(({ id, label, icon: Icon }) => (
            <button
              className={activeSection === id ? "active" : ""}
              type="button"
              key={id}
              onClick={() => selectSection(id)}
              aria-current={activeSection === id ? "page" : undefined}
            >
              <Icon aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>

        <div className={`settings-content settings-view-${activeSection}`}>
          <section className="settings-section settings-status-section" id="settings-notifications">
            <h2>Notifications</h2>
            <label className="settings-toggle">
              <span>
                <strong>Desktop notifications</strong>
                <small>Allow alerts for new support requests.</small>
              </span>
              <input type="checkbox" checked={notificationsEnabled} onChange={toggleNotifications} />
            </label>
            <span className="settings-status">{notificationsEnabled ? "On" : "Off"}</span>
          </section>

          <form className="settings-form" onSubmit={saveSettings}>
            <section className="settings-section settings-card" id="settings-form">
              <h2>Form</h2>
              <label>
                Form title
                <input
                  value={settings.title}
                  onChange={(event) =>
                    setSettings({ ...settings, title: event.target.value })
                  }
                  required
                />
              </label>
              <label>
                Form description
                <textarea
                  value={settings.description}
                  onChange={(event) =>
                    setSettings({ ...settings, description: event.target.value })
                  }
                  rows="3"
                  required
                />
              </label>
            </section>

            <section className="settings-section settings-card" id="settings-categories">
              <h2>Categories</h2>
        <div className="settings-columns">
          <fieldset>
            <legend>Units</legend>
            {asList(settings.units).map((value, index) => (
              <div className="option-editor" key={`units-${index}`}>
                <input
                  value={value}
                  onChange={(event) => updateList("units", index, event.target.value)}
                  required
                />
                <button
                  className="icon-button danger"
                  type="button"
                  onClick={() => removeOption("units", index)}
                  aria-label="Remove unit option"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
            <button
              className="text-button"
              type="button"
              onClick={() => addOption("units")}
            >
              <FaPlus /> Add option
            </button>
          </fieldset>

          <fieldset>
            <legend>Request types</legend>
            {asList(settings.requestTypes).map((value, index) => (
              <div className="option-editor" key={`requestTypes-${index}`}>
                <input
                  value={value}
                  onChange={(event) => updateRequestType(index, event.target.value)}
                  required
                />
                <button
                  className="icon-button danger"
                  type="button"
                  onClick={() => removeRequestType(index)}
                  aria-label="Remove request type option"
                >
                  <FaTrash />
                </button>
              </div>
            ))}
            <button className="text-button" type="button" onClick={addRequestType}>
              <FaPlus /> Add option
            </button>
          </fieldset>
        </div>

        <div className="settings-columns">
          {asList(settings.requestTypes)
            .filter((type) => type.trim().toLowerCase() !== "others")
            .map((type, typeIndex) => (
            <fieldset key={`${type || "request-type"}-${typeIndex}`}>
              <legend>{type || "Request type options"}</legend>
              {asList(requestTypeOptions[type]).map((value, index) => (
                <div className="option-editor" key={`${type}-${index}`}>
                  <input
                    value={value}
                    onChange={(event) =>
                      updateRequestTypeOption(type, index, event.target.value)
                    }
                    required
                  />
                  <button
                    className="icon-button danger"
                    type="button"
                    onClick={() => removeRequestTypeOption(type, index)}
                    aria-label={`Remove ${type || "request type"} option`}
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
              <button
                className="text-button"
                type="button"
                onClick={() => addRequestTypeOption(type)}
              >
                <FaPlus /> Add option
              </button>
            </fieldset>
          ))}
        </div>
            </section>

            <div className="form-actions">
              <span className="save-message">{message}</span>
              <button className="primary-button" type="submit">
                Save settings
              </button>
            </div>
          </form>

          {settingSections.slice(3).map(({ id, label }) => (
            <section className="settings-section settings-status-section" id={`settings-${id}`} key={id}>
              <h2>{label}</h2>
              {id === "database" ? (
                <>
                  <dl className="settings-info-list">
                    <div><dt>Database type</dt><dd>{systemInfo?.databaseType || "Loading..."}</dd></div>
                    <div><dt>Backend port</dt><dd>{systemInfo?.port || "Loading..."}</dd></div>
                    <div><dt>Backup</dt><dd>{systemInfo?.backup || "Loading..."}</dd></div>
                  </dl>
                  <button className="text-button settings-backup-button" type="button" onClick={downloadBackup}>
                    <FaDownload /> Download backup
                  </button>
                  {backupMessage && <p className="save-message">{backupMessage}</p>}
                </>
              ) : (
                <>
                  <p>No {label.toLowerCase()} configuration is connected yet.</p>
                  <span className="settings-status">Not configured</span>
                </>
              )}
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Settings;
