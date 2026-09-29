import { useEffect, useState } from 'react'
import { FaArrowRight, FaArrowRightFromBracket, FaCalendarDays, FaEye, FaRotate, FaTicketSimple } from 'react-icons/fa6'
import { api } from '../api/config'
import ftiLogo from '../assets/fti_logo.png'
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

function GuestHome({ employeeId, onLogout, onOpenForm, onThemeToggle, theme }) {
	const [history, setHistory] = useState({ requests: [], bookings: [] })
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

		api.get('/api/requests/guest/history', { params: { employeeId } })
			.then(({ data }) => {
				if (!isCancelled) setHistory({ requests: data.requests || [], bookings: data.bookings || [] })
			})
			.catch((error) => {
				if (!isCancelled) setErrorMessage(error.response?.data?.message || 'Unable to load your request history.')
			})
			.finally(() => {
				if (!isCancelled) setIsLoading(false)
			})

		return () => {
			isCancelled = true
		}
	}, [employeeId, refreshVersion])

	const hasHistory = history.requests.length > 0 || history.bookings.length > 0

	return (
		<main className="guest-portal-page guest-home-page">
			<header className="guest-portal-topbar">
				<img className="guest-portal-logo" src={ftiLogo} alt="FTI" />
				<div className="guest-portal-header-actions">
					  <span className="guest-id-chip">ID: {employeeId}</span>
					<button
						className="guest-theme-button"
						type="button"
						onClick={onThemeToggle}
						aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
						title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
					>
						<FaEye aria-hidden="true" />
					</button>
					<button className="guest-logout-button" type="button" onClick={onLogout}>
						<FaArrowRightFromBracket aria-hidden="true" />
						<span>Sign out</span>
					</button>
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
						<span className="guest-history-count">{history.requests.length + history.bookings.length} total</span>
					</div>

					{errorMessage && (
						<div className="guest-history-message guest-history-error" role="alert">
							<span>{errorMessage}</span>
							  <button type="button" onClick={refreshHistory}>Try again</button>
						</div>
					)}
					{isLoading ? (
						<p className="guest-history-message" role="status">Loading your activity...</p>
					) : !errorMessage && !hasHistory ? (
						<div className="guest-history-empty">
							<p>No requests are linked to this ID yet.</p>
							<span>New tickets and bookings will appear here.</span>
						</div>
					) : !errorMessage ? (
						<div className="guest-history-list">
							{history.requests.map((request) => (
								<article className="guest-history-row" key={`request-${request.id}`}>
									<span className="guest-history-marker ticket-marker"><FaTicketSimple aria-hidden="true" /></span>
									<div className="guest-history-main">
										<strong>{request.requestType}{request.requestSubType ? ` · ${request.requestSubType}` : ''}</strong>
										<span>{request.controlId} · {formatDate(request.createdAt)}</span>
									</div>
									<span className={`guest-status guest-status-${request.status.toLowerCase()}`}>
										{requestStatusLabels[request.status] || request.status}
									</span>
								</article>
							))}
							{history.bookings.map((booking) => (
								<article className="guest-history-row" key={`booking-${booking.id}`}>
									<span className="guest-history-marker room-marker"><FaCalendarDays aria-hidden="true" /></span>
									<div className="guest-history-main">
										<strong>Board room · {booking.purpose}</strong>
										<span>{formatDate(booking.date)} / {booking.startTime}{booking.endTime ? `-${booking.endTime}` : ''}</span>
									</div>
									<span className={`guest-status guest-status-${booking.status.toLowerCase()}`}>
										{bookingStatusLabels[booking.status] || booking.status}
									</span>
								</article>
							))}
						</div>
					) : null}
				</section>
			</div>
		</main>
	)
}

export default GuestHome
