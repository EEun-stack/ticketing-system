import { useEffect, useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa6";
import { adminFetch } from "../api/adminApi";
import "../styles/settings.css";

const asList = (value) => (Array.isArray(value) ? value : []);

function Settings() {
  const [settings, setSettings] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    adminFetch("/api/admin/settings")
      .then(setSettings)
      .catch((error) => setMessage(error.message));
  }, []);

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
          <p className="home-eyebrow">Guest experience</p>
          <h1>Settings</h1>
        </div>
      </div>
      <form className="settings-form" onSubmit={saveSettings}>
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

        <div className="form-actions">
          <span className="save-message">{message}</span>
          <button className="primary-button" type="submit">
            Save settings
          </button>
        </div>
      </form>
    </section>
  );
}

export default Settings;
