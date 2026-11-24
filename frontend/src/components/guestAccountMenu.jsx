import { useEffect, useRef, useState } from 'react'
import { FaArrowRightFromBracket, FaClipboardList, FaKey } from 'react-icons/fa6'
import { api } from '../api/config'
import '../styles/guestAccountMenu.css'

function GuestAccountMenu({ employeeName, unit, designation, onActivityLogs, onLogout }) {
	const menuRef = useRef(null)
	const [isOpen, setIsOpen] = useState(false)
	const [isSettingsOpen, setIsSettingsOpen] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')
	const [successMessage, setSuccessMessage] = useState('')
	const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
	const initials = employeeName
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0].toUpperCase())
		.join('') || 'U'

	useEffect(() => {
		if (!isOpen) return undefined

		function handlePointerDown(event) {
			if (!menuRef.current?.contains(event.target)) setIsOpen(false)
		}

		function handleKeyDown(event) {
			if (event.key === 'Escape') setIsOpen(false)
		}

		document.addEventListener('pointerdown', handlePointerDown)
		document.addEventListener('keydown', handleKeyDown)
		return () => {
			document.removeEventListener('pointerdown', handlePointerDown)
			document.removeEventListener('keydown', handleKeyDown)
		}
	}, [isOpen])

	function openAccountSettings() {
		setIsOpen(false)
		setIsSettingsOpen(true)
		setErrorMessage('')
		setSuccessMessage('')
		setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
	}

	async function changePassword(event) {
		event.preventDefault()
		if (passwords.newPassword !== passwords.confirmPassword) {
			setErrorMessage('New passwords do not match.')
			return
		}

		setIsSaving(true)
		setErrorMessage('')
		setSuccessMessage('')
		try {
			await api.post('/api/requests/guest/password', {
				currentPassword: passwords.currentPassword,
				newPassword: passwords.newPassword,
			})
			setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
			setSuccessMessage('Password updated successfully.')
		} catch (error) {
			setErrorMessage(error.response?.data?.message || 'Unable to update your password. Please try again.')
		} finally {
			setIsSaving(false)
		}
	}

	async function signOut() {
		setIsOpen(false)
		try {
			await api.post('/api/requests/guest/logout')
		} catch (error) {
			console.error('Unable to record guest sign-out:', error)
		} finally {
			onLogout()
		}
	}

	return (
		<>
			<div className="guest-account-menu" ref={menuRef}>
				<button
					className="guest-avatar-button"
					type="button"
					aria-label="Open account menu"
					aria-haspopup="menu"
					aria-expanded={isOpen}
					onClick={() => setIsOpen((open) => !open)}
				>
					<span aria-hidden="true">{initials}</span>
				</button>
				{isOpen && (
					<div className="guest-account-dropdown" role="menu">
						<div className="guest-account-identity">
							<strong>{employeeName}</strong>
							<span>{unit || 'Unit not set'}</span>
							<span>{designation || 'Designation not set'}</span>
						</div>
						<button
							type="button"
							role="menuitem"
							onClick={() => {
								setIsOpen(false)
								onActivityLogs()
							}}
						>
							<FaClipboardList aria-hidden="true" />
							<span>Activity logs</span>
						</button>
						<button type="button" role="menuitem" onClick={openAccountSettings}>
							<FaKey aria-hidden="true" />
							<span>Account settings</span>
						</button>
						<button className="guest-account-signout" type="button" role="menuitem" onClick={signOut}>
							<FaArrowRightFromBracket aria-hidden="true" />
							<span>Sign out</span>
						</button>
					</div>
				)}
			</div>

			{isSettingsOpen && (
				<div className="guest-account-modal-backdrop" role="presentation" onClick={(event) => {
					if (event.target === event.currentTarget) setIsSettingsOpen(false)
				}}>
					<section className="guest-account-modal" role="dialog" aria-modal="true" aria-labelledby="guest-account-title">
						<div className="guest-account-modal-heading">
							<div>
								<p>Account settings</p>
								<h2 id="guest-account-title">Change password</h2>
							</div>
							<button type="button" onClick={() => setIsSettingsOpen(false)} aria-label="Close account settings">×</button>
						</div>
						<form className="guest-account-password-form" onSubmit={changePassword}>
							<label>
								Current password
								<input
									autoComplete="current-password"
									type="password"
									maxLength="128"
									value={passwords.currentPassword}
									onChange={(event) => setPasswords((current) => ({ ...current, currentPassword: event.target.value }))}
									required
								/>
							</label>
							<label>
								New password
								<input
									autoComplete="new-password"
									type="password"
									minLength="8"
									maxLength="128"
									value={passwords.newPassword}
									onChange={(event) => setPasswords((current) => ({ ...current, newPassword: event.target.value }))}
									required
								/>
							</label>
							<label>
								Confirm new password
								<input
									autoComplete="new-password"
									type="password"
									minLength="8"
									maxLength="128"
									value={passwords.confirmPassword}
									onChange={(event) => setPasswords((current) => ({ ...current, confirmPassword: event.target.value }))}
									required
								/>
							</label>
							{errorMessage && <p className="guest-account-message error" role="alert">{errorMessage}</p>}
							{successMessage && <p className="guest-account-message success" role="status">{successMessage}</p>}
							<div className="guest-account-modal-actions">
								<button type="button" onClick={() => setIsSettingsOpen(false)}>Close</button>
								<button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Update password'}</button>
							</div>
						</form>
					</section>
				</div>
			)}
		</>
	)
}

export default GuestAccountMenu
