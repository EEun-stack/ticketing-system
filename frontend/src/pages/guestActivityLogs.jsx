import { useCallback, useEffect, useState } from 'react'
import { FaArrowRightFromBracket, FaEye, FaKey, FaRotate, FaUser } from 'react-icons/fa6'
import { api } from '../api/config'
import ftiLogo from '../assets/fti_logo.png'
import GuestAccountMenu from '../components/guestAccountMenu'
import '../styles/guestportal.css'

const activityLabels = {
	GUEST_LOGIN: { label: 'Signed in', Icon: FaUser },
	GUEST_LOGOUT: { label: 'Signed out', Icon: FaArrowRightFromBracket },
	GUEST_PASSWORD_CHANGED: { label: 'Password changed', Icon: FaKey },
}

function GuestActivityLogs({ employeeId, onActivityLogs, onHome, onLogout, onThemeToggle, theme }) {
	const today = new Date()
	const [employeeName] = useState(() => {
		try {
			return localStorage.getItem(`guestRequestName:${employeeId}`)?.trim() || 'Employee'
		} catch {
			return 'Employee'
		}
	})
	const [unit] = useState(() => {
		try {
			return localStorage.getItem(`guestRequestDepartment:${employeeId}`)?.trim() || ''
		} catch {
			return ''
		}
	})
	const [activities, setActivities] = useState([])
	const [isLoading, setIsLoading] = useState(true)
	const [errorMessage, setErrorMessage] = useState('')
	const [refreshVersion, setRefreshVersion] = useState(0)
	const refresh = useCallback(() => {
		setIsLoading(true)
		setErrorMessage('')
		setRefreshVersion((version) => version + 1)
	}, [])

	useEffect(() => {
		let isCancelled = false
		api.get('/api/requests/guest/history')
			.then(({ data }) => {
				if (!isCancelled) setActivities(data.activities || [])
			})
			.catch((error) => {
				if (isCancelled) return
				if (error.response?.status === 401) {
					onLogout()
					return
				}
				setErrorMessage(error.response?.data?.message || 'Unable to load your activity logs.')
			})
			.finally(() => {
				if (!isCancelled) setIsLoading(false)
			})

		return () => {
			isCancelled = true
		}
	}, [onLogout, refreshVersion])

	return (
		<main className="guest-portal-page guest-home-page">
			<header className="guest-portal-topbar">
				<img className="guest-portal-logo" src={ftiLogo} alt="FTI" />
				<time className="guest-home-date">
					<span className="guest-home-date-full">
						{today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
					</span>
					<span className="guest-home-date-compact">
						{today.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
					</span>
				</time>
				<div className="guest-portal-header-actions">
					<button
						className="guest-theme-button"
						type="button"
						onClick={onThemeToggle}
						aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
						title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
					>
						<FaEye aria-hidden="true" />
					</button>
					<GuestAccountMenu
						employeeName={employeeName}
						unit={unit}
						onActivityLogs={onActivityLogs}
						onLogout={onLogout}
					/>
				</div>
			</header>

			<div className="guest-home-content">
				<section className="guest-home-heading">
					<div>
						<p className="guest-portal-kicker">YOUR ACCOUNT</p>
						<h1>Activity logs</h1>
						<p>Review your recent sign-ins and account changes.</p>
					</div>
					<div className="guest-activity-page-actions">
						<button className="guest-home-link" type="button" onClick={onHome}>My requests</button>
						<button className="guest-refresh-button" type="button" onClick={refresh} disabled={isLoading} aria-label="Refresh activity logs" title="Refresh activity logs">
							<FaRotate aria-hidden="true" />
						</button>
					</div>
				</section>

				<section className="guest-history" aria-labelledby="guest-activity-title">
					<div className="guest-history-heading">
						<div>
							<p className="guest-portal-kicker">ACCOUNT ACTIVITY</p>
							<h2 id="guest-activity-title">Sign-ins and changes</h2>
						</div>
						<span className="guest-history-count">{activities.length} total</span>
					</div>
					{errorMessage && (
						<div className="guest-history-message guest-history-error" role="alert">
							<span>{errorMessage}</span>
							<button type="button" onClick={refresh}>Try again</button>
						</div>
					)}
					{isLoading ? (
						<p className="guest-history-message" role="status">Loading your activity logs...</p>
					) : !errorMessage && activities.length === 0 ? (
						<div className="guest-history-empty">
							<p>No account activity has been recorded yet.</p>
							<span>Sign-ins, sign-outs, and password changes will appear here.</span>
						</div>
					) : !errorMessage ? (
						<div className="guest-history-list">
							{activities.map((activity) => {
								const { label, Icon } = activityLabels[activity.action] || activityLabels.GUEST_LOGIN
								return (
									<article className="guest-history-row guest-account-activity-row" key={activity.id}>
										<span className="guest-history-marker"><Icon aria-hidden="true" /></span>
										<div className="guest-history-main">
											<strong>{label}</strong>
											<span>{new Date(activity.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
										</div>
									</article>
								)
							})}
						</div>
					) : null}
				</section>
			</div>
		</main>
	)
}

export default GuestActivityLogs
