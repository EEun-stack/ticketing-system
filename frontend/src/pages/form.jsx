import { useState } from 'react'
import { FaMoon, FaShieldHalved, FaSun } from 'react-icons/fa6'
import ftiLogo from '../assets/fti_logo.png'
import '../styles/form.css'

const requestTypes = [
  'Hardware',
  'Software',
  'Network',
  'Account / Access',
  'Printer',
  'Other',
]

function GuestRequestForm({ onAdminLogin, onThemeToggle, theme }) {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
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
          <h1>IT Support Request</h1>
          <p>Tell us what you need help with and our IT team will get back to you.</p>
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
                  {requestTypes.map((type) => (
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
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="attachment">Attachment / Screenshot</label>
                <input id="attachment" name="attachment" type="file" accept="image/*,.pdf" />
              </div>
            </div>

            <button className="submit-request" type="submit">Submit Request</button>
          </form>
        )}
      </section>
    </main>
  )
}

export default GuestRequestForm
