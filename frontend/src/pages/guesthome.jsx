import { useEffect, useState } from 'react'
import { FaArrowRight, FaCalendarDays, FaEye, FaRotate, FaTicketSimple } from 'react-icons/fa6'
import { api } from '../api/config'
import ftiLogo from '../assets/fti_logo.png'
import GuestAccountMenu from '../components/guestAccountMenu'
import '../styles/guestportal.css'

const requestStatusLabels = {
	NEW: 'New',
	PENDING: 'Pending',
	FOR_APPROVAL: 'For approval',
	IN_PROGRESS: 'In progress',
	RESOLVED: 'Resolved',
}

const bookingStatusLabels = {
	PENDING: 'Pending',
	APPROVED: 'Approved',
	DECLINED: 'Declined',
	CANCELLED: 'Cancelled',
}

function formatDate(value, options = { dateStyle: 'medium' }) {
	const date = /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? new Date(`${value}T12:00:00`) : new Date(value)
	return date.toLocaleDateString(undefined, options)
}

function GuestHome({ employeeId, onActivityLogs, onLogout, onOpenForm, onThemeToggle, theme }) {
	const today = new Date()
	const [employeeName] = useState(() => {
		try {
			return localStorage.getItem(`guestRequestName:${employeeId}`)?.trim() || 'Employee'
		} catch {
			return 'Employee'
		}
	})
	const [employeeUnit] = useState(() => {
		try {
			return localStorage.getItem(`guestRequestDepartment:${employeeId}`)?.trim() || ''
		} catch {
			return ''
		}
	})
	const [history, setHistory] = useState({ requests: [], bookings: [], activities: [] })
	const [isLoading, setIsLoading] = useState(true)
	const [errorMessage, setErrorMessage] = useState('')
	const [refreshVersion, setRefreshVersion] = useState(0)

	function refreshHistory() {
		setIsLoading(true)
		setErrorMessage('')
		setRefreshVersion((version) => version + 1)
	}

	useEffect(() => {
		let isCancelled = false

		api.get('/api/requests/guest/history')
			.then(({ data }) => {
				if (!isCancelled) {
					setHistory({
						requests: data.requests || [],
						bookings: data.bookings || [],
						activities: data.activities || [],
					})
				}
			})
			.catch((error) => {
				if (isCancelled) return
				if (error.response?.status === 401) {
					onLogout()
					return
				}
				setErrorMessage(error.response?.data?.message || 'Unable to load your request history.')
			})
			.finally(() => {
				if (!isCancelled) setIsLoading(false)
			})

		return () => {
			isCancelled = true
		}
	}, [employeeId, onLogout, refreshVersion])

	const activityEntries = [
		...history.requests.map((request) => ({ ...request, kind: 'request' })),
		...history.bookings.map((booking) => ({ ...booking, kind: 'booking' })),
	].sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime())
	const hasHistory = activityEntries.length > 0

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
						unit={employeeUnit}
						onActivityLogs={onActivityLogs}
						onLogout={onLogout}
					/>
				</div>
			</header>

			<div className="guest-home-content">
				<section className="guest-home-heading">
					<div>
						<p className="guest-portal-kicker">EMPLOYEE PORTAL</p>
						<h1>Your service desk</h1>
						<p>Track your requests and room bookings in one place.</p>
					</div>
					  <button className="guest-refresh-button" type="button" onClick={refreshHistory} disabled={isLoading} aria-label="Refresh history" title="Refresh history">
						<FaRotate aria-hidden="true" />
					</button>
				</section>

				<section className="guest-action-grid" aria-label="Create a request">
					<button className="guest-action-button guest-action-ticket" type="button" onClick={() => onOpenForm('ticket')}>
						<span className="guest-action-icon"><FaTicketSimple aria-hidden="true" /></span>
						<span className="guest-action-copy"><strong>Request IT support</strong><small>Submit a new help ticket</small></span>
						<FaArrowRight className="guest-action-arrow" aria-hidden="true" />
					</button>
					<button className="guest-action-button guest-action-room" type="button" onClick={() => onOpenForm('board-room')}>
						<span className="guest-action-icon"><FaCalendarDays aria-hidden="true" /></span>
						<span className="guest-action-copy"><strong>Board room schedule</strong><small>Check availability or book a room</small></span>
						<FaArrowRight className="guest-action-arrow" aria-hidden="true" />
					</button>
				</section>

				<section className="guest-history" aria-labelledby="guest-history-title">
					<div className="guest-history-heading">
						<div>
							<p className="guest-portal-kicker">YOUR ACTIVITY</p>
							<h2 id="guest-history-title">Recent requests</h2>
						</div>
						<span className="guest-history-count">{activityEntries.length} total</span>
					</div>

					{errorMessage && (
						<div className="guest-history-message guest-history-error" role="alert">
							<span>{errorMessage}</span>
							  <button type="button" onClick={refreshHistory}>Try again</button>
						</div>
					)}
					{isLoading ? (
						<p className="guest-history-message" role="status">Loading your requests...</p>
					) : !errorMessage && !hasHistory ? (
						<div className="guest-history-empty">
						<p>No requests are linked to this ID yet.</p>
						<span>New tickets and bookings will appear here.</span>
						</div>
					) : !errorMessage ? (
						<div className="guest-history-list">
							{activityEntries.map((entry) => {
								if (entry.kind === 'request') {
									return (
										<article className="guest-history-row" key={`request-${entry.id}`}>
											<span className="guest-history-marker ticket-marker"><FaTicketSimple aria-hidden="true" /></span>
											<div className="guest-history-main">
												<strong>{entry.requestType}{entry.requestSubType ? ` · ${entry.requestSubType}` : ''}</strong>
												<span>{entry.controlId} · {formatDate(entry.createdAt)}</span>
											</div>
											<span className={`guest-status guest-status-${entry.status.toLowerCase()}`}>
												{requestStatusLabels[entry.status] || entry.status}
											</span>
										</article>
									)
								}
								if (entry.kind === 'booking') {
									return (
										<article className="guest-history-row" key={`booking-${entry.id}`}>
											<span className="guest-history-marker room-marker"><FaCalendarDays aria-hidden="true" /></span>
											<div className="guest-history-main">
												<strong>Board room · {entry.purpose}</strong>
												<span>{formatDate(entry.date)} / {entry.startTime}{entry.endTime ? `-${entry.endTime}` : ''}</span>
											</div>
											<span className={`guest-status guest-status-${entry.status.toLowerCase()}`}>
												{bookingStatusLabels[entry.status] || entry.status}
											</span>
										</article>
									)
								}

							})}
						</div>
					) : null}
				</section>
			</div>
		</main>
	)
}

export default GuestHome
