import { useEffect, useState } from 'react'
import { FaMoon, FaShieldHalved, FaSun } from 'react-icons/fa6'
import ftiLogo from '../assets/fti_logo.png'
import '../styles/form.css'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const fallbackSettings = {
  title: 'IT Support Request',
  description: 'Tell us what you need help with and our IT team will get back to you.',
  requestTypes: ['Hardware', 'Software', 'Network', 'Account / Access', 'Printer', 'Other'],
  priorities: ['Low', 'Medium', 'High', 'Urgent'],
}

function GuestRequestForm({ onAdminLogin, onThemeToggle, theme }) {
  const [submitted, setSubmitted] = useState(false)
  const [settings, setSettings] = useState(fallbackSettings)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    fetch(`${apiUrl}/api/requests/settings`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Unable to load form settings.')))
      .then(setSettings)
      .catch(() => {})
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage('')

    const formElement = event.currentTarget
    const formData = new FormData(formElement)
    const values = Object.fromEntries(formData.entries())

    try {
      const response = await fetch(`${apiUrl}/api/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Unable to submit request.')
      setSubmitted(true)
      formElement.reset()
    } catch (error) {
      setErrorMessage(error.message)
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
                <input id="employee-name" name="employeeName" type="text" required />
              </div>

              <div className="form-field">
                <label htmlFor="department">Department / Office</label>
                <input id="department" name="department" type="text" required />
              </div>

              <div className="form-field">
                <label htmlFor="contact">Contact Number or Email</label>
                <input id="contact" name="contact" type="text" required />
              </div>

              <fieldset className="request-types">
                <legend>Request Type</legend>
                <div className="type-options">
                  {settings.requestTypes.map((type) => (
                    <label className="type-option" key={type}>
                      <input type="radio" name="requestType" value={type} required />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="form-field full-width">
                <label htmlFor="subject">Subject</label>
                <input id="subject" name="subject" type="text" required />
              </div>

              <div className="form-field full-width">
                <label htmlFor="description">Description of Problem</label>
                <textarea id="description" name="description" rows="6" required />
              </div>

              <div className="form-field">
                <label htmlFor="priority">Priority</label>
                <select id="priority" name="priority" defaultValue="" required>
                  <option value="" disabled>Select priority</option>
                  {settings.priorities.map((priority) => (
                    <option value={priority} key={priority}>{priority}</option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="attachment">Attachment / Screenshot</label>
                <input id="attachment" name="attachment" type="file" accept="image/*,.pdf" />
              </div>
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
