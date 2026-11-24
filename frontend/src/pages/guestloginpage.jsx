import { useState } from 'react'
import { FaArrowRight, FaEye } from 'react-icons/fa6'
import { api } from '../api/config'
import ftiLogo from '../assets/fti_logo.png'
import '../styles/guestportal.css'

const guestEmployeeIdKey = 'guestEmployeeId'
const requestDraftKey = 'guestRequestDraft'

function GuestLoginPage({ onLoginSuccess, onThemeToggle, theme }) {
	const [employeeId, setEmployeeId] = useState('')
	const [password, setPassword] = useState('')
	const [errorMessage, setErrorMessage] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)

	async function handleSubmit(event) {
		event.preventDefault()
		const normalizedId = employeeId.trim().toUpperCase()
		if (!normalizedId || normalizedId.length > 64) {
			setErrorMessage('Enter a valid employee ID.')
			return
		}

		setIsSubmitting(true)
		setErrorMessage('')
		let employeeProfile
		try {
			const { data } = await api.post('/api/requests/guest/verify', { employeeId: normalizedId, password })
			employeeProfile = data
		} catch (error) {
			setErrorMessage(error.response?.data?.message || 'Unable to sign in. Check your connection and try again.')
			setIsSubmitting(false)
			return
		}

		try {
			localStorage.setItem(guestEmployeeIdKey, normalizedId)
			const nameKey = `guestRequestName:${normalizedId}`
			const unitKey = `guestRequestDepartment:${normalizedId}`
			const designationKey = `guestRequestDesignation:${normalizedId}`
			localStorage.setItem(nameKey, employeeProfile.name || '')
			if (employeeProfile.unit) localStorage.setItem(unitKey, employeeProfile.unit)
			else localStorage.removeItem(unitKey)
			if (employeeProfile.designation) localStorage.setItem(designationKey, employeeProfile.designation)
			else localStorage.removeItem(designationKey)

			let draft = {}
			try {
				draft = JSON.parse(localStorage.getItem(`${requestDraftKey}:${normalizedId}`) || '{}')
			} catch {
				draft = {}
			}
			localStorage.setItem(`${requestDraftKey}:${normalizedId}`, JSON.stringify({
				...draft,
				employeeName: employeeProfile.name || '',
				department: employeeProfile.unit || '',
			}))
		} catch {
			setErrorMessage('This browser could not save your session. Check its privacy settings and try again.')
			setIsSubmitting(false)
			return
		}

		setPassword('')
		onLoginSuccess()
		setIsSubmitting(false)
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
					<p className="guest-portal-kicker">FTI / TICKETING SERVICES</p>
					<h1>Good to see you.</h1>
					<p>Sign in to follow your IT requests and board room reservation.</p>
				</div>
				<form className="guest-login-form" onSubmit={handleSubmit}>
					<label htmlFor="guest-employee-id">ID Number</label>
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
					<label htmlFor="guest-password">Password</label>
					<input
						autoComplete="current-password"
						id="guest-password"
						onChange={(event) => {
							setPassword(event.target.value)
							setErrorMessage('')
						}}
						placeholder="Enter your password"
						required
						type="password"
						value={password}
					/>
					{errorMessage && <p className="guest-login-error" role="alert">{errorMessage}</p>}
					<button className="guest-primary-button" type="submit" disabled={isSubmitting}>
						{isSubmitting ? 'Signing in...' : 'Sign in'} {!isSubmitting && <FaArrowRight aria-hidden="true" />}
					</button>
				</form>
			</section>
			<footer className="guest-portal-footer">Facilities and Technology Institute</footer>
		</main>
	)
}

export default GuestLoginPage
