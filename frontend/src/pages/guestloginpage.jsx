import { useState } from 'react'
import { FaArrowRight, FaEye } from 'react-icons/fa6'
import ftiLogo from '../assets/fti_logo.png'
import '../styles/guestportal.css'

const guestEmployeeIdKey = 'guestEmployeeId'

function GuestLoginPage({ onAdminLogin, onLoginSuccess, onThemeToggle, theme }) {
	const [employeeId, setEmployeeId] = useState('')
	const [errorMessage, setErrorMessage] = useState('')

	function handleSubmit(event) {
		event.preventDefault()
		const normalizedId = employeeId.trim().toUpperCase()
		if (!normalizedId || normalizedId.length > 64) {
			setErrorMessage('Enter a valid employee ID.')
			return
		}

		try {
			localStorage.setItem(guestEmployeeIdKey, normalizedId)
			onLoginSuccess()
		} catch {
			setErrorMessage('This browser could not save your session. Check its privacy settings and try again.')
		}
	}

	return (
		<main className="guest-portal-page guest-login-page">
			<header className="guest-portal-topbar">
				<img className="guest-portal-logo" src={ftiLogo} alt="FTI" />
				<button
					className="guest-theme-button"
					type="button"
					onClick={onThemeToggle}
					aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
					title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
				>
					<FaEye aria-hidden="true" />
				</button>
			</header>

			<section className="guest-login-content">
				<div className="guest-login-intro">
					  <p className="guest-portal-kicker">FTI / EMPLOYEE SERVICES</p>
					<h1>Good to see you.</h1>
					<p>Sign in to follow your IT requests and board room bookings.</p>
				</div>
				<form className="guest-login-form" onSubmit={handleSubmit}>
					<label htmlFor="guest-employee-id">Employee ID</label>
					<input
						autoComplete="username"
						autoCapitalize="characters"
						id="guest-employee-id"
						maxLength={64}
						onChange={(event) => {
							setEmployeeId(event.target.value)
							setErrorMessage('')
						}}
						placeholder="Enter your ID number"
						required
						value={employeeId}
					/>
					{errorMessage && <p className="guest-login-error" role="alert">{errorMessage}</p>}
					<button className="guest-primary-button" type="submit">
						Continue <FaArrowRight aria-hidden="true" />
					</button>
					<button className="guest-admin-link" type="button" onClick={onAdminLogin}>
						Administrator sign in
					</button>
				</form>
			</section>
			<footer className="guest-portal-footer">Facilities and Technology Institute</footer>
		</main>
	)
}

export default GuestLoginPage
