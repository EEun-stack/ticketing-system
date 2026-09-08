import { useEffect, useRef, useState } from 'react'
import { FaMoon, FaShieldHalved, FaSun, FaEye } from 'react-icons/fa6'
import { api } from '../api/config'
import ftiLogo from '../assets/fti_logo.png'
import '../styles/form.css'

const fallbackSettings = {
  title: 'IT Support Request',
  description: 'Tell us what you need help with and our IT team will get back to you.',
  units: ['Main Office'],
  requestTypes: ['Hardware', 'Software', 'Network', 'Account / Access', 'Printer', 'Other'],
  requestTypeOptions: {
    Hardware: ['Desktop', 'Laptop'],
    Software: ['Installation', 'Error'],
    Network: ['Internet', 'Wi-Fi'],
    'Account / Access': ['Password', 'Permission'],
    Printer: ['Cannot print', 'Paper jam'],
    Other: [],
  },
}

const draftStorageKey = 'guestRequestDraft'
const submittedRequestStorageKey = 'guestSubmittedRequest'
const requestStatusLabels = {
  NEW: 'Waiting for IT staff to claim this ticket',
  PENDING: 'Pending',
  FOR_APPROVAL: 'Waiting for approval',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
}

function readStoredValue(key, fallback) {
  try {
    const storedValue = localStorage.getItem(key)
    return storedValue ? JSON.parse(storedValue) : fallback
  } catch {
    return fallback
  }
}

function normalizeSettings(value) {
  const nextSettings = value && typeof value === 'object' ? value : {}

  return {
    ...fallbackSettings,
    ...nextSettings,
    units: Array.isArray(nextSettings.units) && nextSettings.units.length ? nextSettings.units : fallbackSettings.units,
    requestTypes: Array.isArray(nextSettings.requestTypes) && nextSettings.requestTypes.length ? nextSettings.requestTypes : fallbackSettings.requestTypes,
    requestTypeOptions:
      nextSettings.requestTypeOptions && typeof nextSettings.requestTypeOptions === 'object'
        ? nextSettings.requestTypeOptions
        : fallbackSettings.requestTypeOptions,
  }
}

function debounce(callback, delay) {
  let timeoutId = null

  const debouncedCallback = (...args) => {
    if (timeoutId) return

    timeoutId = setTimeout(() => {
      timeoutId = null
      callback(...args)
    }, delay)
  }

  debouncedCallback.cancel = () => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = null
  }

  return debouncedCallback
}

function GuestRequestForm({ onAdminLogin, onThemeToggle, theme }) {
  const [submittedRequest, setSubmittedRequest] = useState(() => readStoredValue(submittedRequestStorageKey, null))
  const [settings, setSettings] = useState(fallbackSettings)
  const [selectedRequestType, setSelectedRequestType] = useState(() => readStoredValue(draftStorageKey, {}).requestType || '')
  const [selectedRequestSubType, setSelectedRequestSubType] = useState(() => readStoredValue(draftStorageKey, {}).requestSubType || '')
  const [otherRequestSubType, setOtherRequestSubType] = useState(() => readStoredValue(draftStorageKey, {}).otherRequestSubType || '')
  const [requestStatus, setRequestStatus] = useState(null)
  const [employeeName, setEmployeeName] = useState(() => {
    const draft = readStoredValue(draftStorageKey, {})
    if (draft.employeeName) return draft.employeeName
    try {
      return localStorage.getItem('guestRequestName') || ''
    } catch {
      return ''
    }
  })
  const [department, setDepartment] = useState(() => {
    const draft = readStoredValue(draftStorageKey, {})
    if (draft.department) return draft.department
    try {
      return localStorage.getItem('guestRequestDepartment') || ''
    } catch {
      return ''
    }
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const submitLockRef = useRef(false)
  const debouncedSubmitRef = useRef(null)
  const submitted = Boolean(submittedRequest)

  useEffect(() => {
    if (!submittedRequest?.id) return undefined

    let isCancelled = false
    const loadStatus = async () => {
      try {
        const { data } = await api.get(`/api/requests/${submittedRequest.id}`)
        if (!isCancelled) setRequestStatus(data)
      } catch (error) {
        if (!isCancelled && error.response?.status === 404) {
          setSubmittedRequest(null)
          localStorage.removeItem(submittedRequestStorageKey)
        }
      }
    }

    loadStatus()
    const interval = window.setInterval(loadStatus, 5000)
    return () => {
      isCancelled = true
      window.clearInterval(interval)
    }
  }, [submittedRequest?.id])

  useEffect(() => {
    if (submitted) return

    try {
      localStorage.setItem(draftStorageKey, JSON.stringify({
        employeeName,
        department,
        requestType: selectedRequestType,
        requestSubType: selectedRequestSubType,
        otherRequestSubType,
      }))
    } catch {
      // Ignore storage errors for private browsing or restricted environments.
    }
  }, [department, employeeName, otherRequestSubType, selectedRequestSubType, selectedRequestType, submitted])

  useEffect(() => {
    try {
      localStorage.setItem('guestRequestName', employeeName)
    } catch {
      // Ignore storage errors for private browsing or restricted environments.
    }
  }, [employeeName])

  useEffect(() => {
    try {
      localStorage.setItem('guestRequestDepartment', department)
    } catch {
      // Ignore storage errors for private browsing or restricted environments.
    }
  }, [department])

  useEffect(() => {
    api.get('/api/requests/settings')
      .then(({ data }) => setSettings(normalizeSettings(data)))
      .catch(() => setSettings(fallbackSettings))
  }, [])

  useEffect(() => {
    const submitRequest = async (values, formElement) => {
      try {
        const { data } = await api.post('/api/requests', values)
        setSubmittedRequest(data)
        setRequestStatus(data)
        localStorage.setItem(submittedRequestStorageKey, JSON.stringify(data))
        localStorage.removeItem(draftStorageKey)
        setSelectedRequestType('')
        setSelectedRequestSubType('')
        setOtherRequestSubType('')
        formElement.reset()
      } catch (error) {
        setErrorMessage(error.response?.data?.message || error.message || 'Unable to submit request.')
      } finally {
        submitLockRef.current = false
        setIsSubmitting(false)
      }
    }

    const debouncedSubmit = debounce(submitRequest, 400)
    debouncedSubmitRef.current = debouncedSubmit

    return () => debouncedSubmit.cancel()
  }, [])

  function handleSubmit(event) {
    event.preventDefault()

    if (submitLockRef.current) return

    submitLockRef.current = true
    setIsSubmitting(true)
    setErrorMessage('')

    const formElement = event.currentTarget
    const formData = new FormData(formElement)
    const values = Object.fromEntries(formData.entries())
    delete values.otherRequestType

    debouncedSubmitRef.current(values, formElement)
  }

  return (
    <main className="request-page">
      <div className="guest-topbar">
        <img className="guest-logo" src={ftiLogo} alt="FTI" />
        <span className="guest-date">
          {new Date().toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </span>
        <div className="guest-actions">
          <button
            className="guest-icon-button"
            type="button"
            onClick={onThemeToggle}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <FaEye aria-hidden="true" /> : <FaEye aria-hidden="true" />}
          </button>
        </div>
      </div>
      <section className="request-card">
        <header className="request-header">
          <h1>{settings.title}</h1>
          <p>{settings.description}</p>
        </header>

        {submitted ? (
          <div className="request-success" role="status">
            <h2>{requestStatus?.claimedByName ? 'Your ticket is being handled' : 'Waiting for IT staff'}</h2>
            <p>
              {requestStatus?.claimedByName
                ? `Accepted by ${requestStatus.claimedByName}.`
                : 'Your ticket was submitted and is waiting for an IT staff member to claim it.'}
            </p>
            {!requestStatus?.claimedByName && (
              <strong className="request-status-label">
                Waiting for IT staff to claim this ticket
              </strong>
            )}
            {requestStatus?.claimedByName && requestStatus.status !== 'NEW' && (
              <strong className="request-status-label">
                {requestStatusLabels[requestStatus.status] || 'Ticket in progress'}
              </strong>
            )}
            {requestStatus?.statusUpdatedByName && requestStatus.status !== 'NEW' && (
              <p>Latest update by {requestStatus.statusUpdatedByName}.</p>
            )}
            <button type="button" onClick={() => {
              setSubmittedRequest(null)
              setRequestStatus(null)
              localStorage.removeItem(submittedRequestStorageKey)
            }}>
              Submit another request
            </button>
          </div>
        ) : (
          <form className="support-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="employee-name">Employee Name</label>
                <input
                  id="employee-name"
                  name="employeeName"
                  type="text"
                  value={employeeName}
                  onChange={(event) => setEmployeeName(event.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="department">Department / Office</label>
                <select
                  id="department"
                  name="department"
                  value={department}
                  onChange={(event) => setDepartment(event.target.value)}
                  required
                >
                  <option value="" disabled>Select unit</option>
                  {settings.units.map((unit) => <option value={unit} key={unit}>{unit}</option>)}
                </select>
              </div>

              <fieldset className="request-types">
                <legend>Nature</legend>
                <div className="type-options">
                  {settings.requestTypes.map((type) => (
                    <label className="type-option" key={type}>
                      <input
                        type="radio"
                        name="requestType"
                        value={type}
                        checked={selectedRequestType === type}
                        onChange={(event) => {
                          setSelectedRequestType(event.target.value)
                          setSelectedRequestSubType('')
                        }}
                        required
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {selectedRequestType && selectedRequestType !== 'Other' && settings.requestTypeOptions?.[selectedRequestType]?.length > 0 && (
                <fieldset className="request-types nested-request-types">
                  <legend>{selectedRequestType} options</legend>
                  <div className="type-options">
                    {settings.requestTypeOptions[selectedRequestType].map((option) => (
                      <label className="type-option" key={option}>
                        <input
                          type="radio"
                          name="requestSubType"
                          value={option}
                          checked={selectedRequestSubType === option}
                          onChange={(event) => setSelectedRequestSubType(event.target.value)}
                          required
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}

              {selectedRequestType === 'Other' && (
                <div className="form-field">
                  <label htmlFor="other-request-type">Please specify</label>
                  <textarea
                    id="other-request-type"
                    name="requestSubType"
                    rows="6"
                    value={otherRequestSubType}
                    onChange={(event) => setOtherRequestSubType(event.target.value)}
                    required
                  />
                </div>
              )}

            </div>

            {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
            <button className="submit-request" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        )}
      </section>
    </main>
  )
}

export default GuestRequestForm
