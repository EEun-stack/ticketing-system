import { useEffect, useState } from 'react'
import { FaMoon, FaShieldHalved, FaSun } from 'react-icons/fa6'
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

function GuestRequestForm({ onAdminLogin, onThemeToggle, theme }) {
  const [submitted, setSubmitted] = useState(false)
  const [settings, setSettings] = useState(fallbackSettings)
  const [selectedRequestType, setSelectedRequestType] = useState('')
  const [selectedRequestSubType, setSelectedRequestSubType] = useState('')
  const [employeeName, setEmployeeName] = useState(() => {
    try {
      return localStorage.getItem('guestRequestName') || ''
    } catch {
      return ''
    }
  })
  const [department, setDepartment] = useState(() => {
    try {
      return localStorage.getItem('guestRequestDepartment') || ''
    } catch {
      return ''
    }
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

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
      .then(({ data }) => setSettings(data))
      .catch(() => {})
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')

    const formElement = event.currentTarget
    const formData = new FormData(formElement)
    const values = Object.fromEntries(formData.entries())
    delete values.otherRequestType

    try {
      await api.post('/api/requests', values)
      setSubmitted(true)
      setSelectedRequestType('')
      setSelectedRequestSubType('')
      formElement.reset()
    } catch (error) {
      setErrorMessage(error.response?.data?.message || error.message || 'Unable to submit request.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="request-page">
      <div className="guest-topbar">
        <img className="guest-logo" src={ftiLogo} alt="FTI" />
        <div className="guest-actions">
          <button
            className="guest-icon-button"
            type="button"
            onClick={onThemeToggle}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <FaMoon aria-hidden="true" /> : <FaSun aria-hidden="true" />}
          </button>
          <button
            className="guest-icon-button"
            type="button"
            onClick={onAdminLogin}
            aria-label="Admin login"
            title="Admin login"
          >
            <FaShieldHalved aria-hidden="true" />
          </button>
        </div>
      </div>
      <section className="request-card">
        <header className="request-header">
          <p className="request-label">Guest support</p>
          <h1>{settings.title}</h1>
          <p>{settings.description}</p>
        </header>

        {submitted ? (
          <div className="request-success" role="status">
            <h2>Request submitted</h2>
            <p>Your support request has been received. We will contact you shortly.</p>
            <button type="button" onClick={() => setSubmitted(false)}>
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
                <legend>Request Type</legend>
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
                  <input id="other-request-type" name="requestSubType" type="text" required />
                </div>
              )}

              {selectedRequestType === 'Other' && (
                <>
                  <div className="form-field full-width">
                    <label htmlFor="subject">Subject</label>
                    <input id="subject" name="subject" type="text" required />
                  </div>

                  <div className="form-field full-width">
                    <label htmlFor="description">Description of Problem</label>
                    <textarea id="description" name="description" rows="6" required />
                  </div>
                </>
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
