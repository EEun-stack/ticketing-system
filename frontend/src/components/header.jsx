import { useEffect, useState } from 'react'
import {
  FaBars,
  FaChevronDown,
  FaMoon,
  FaEye,
  FaShieldHalved,
  FaSun,
} from 'react-icons/fa6'
import Notifications from './notifications'
import '../styles/header.css'

function Header({
  currentUser,
  onNotificationSelect,
  onThemeToggle,
  onNavigate,
  onAccountSettings,
  onSidebarToggle,
  requestNotifications,
  sidebarCollapsed,
  theme,
}) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [now, setNow] = useState(new Date())
  const isAuthenticated = Boolean(currentUser)
  const userDisplayName = currentUser?.name || currentUser?.email || 'User'
  const firstLetter = userDisplayName.trim().charAt(0).toUpperCase() || 'U'

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  const formattedDateTime = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'numeric',
    day: 'numeric',
    year: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(now)

  return (
    <header className={`site-header ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="header-left">
        <button
          className="sidebar-header-toggle"
          type="button"
          onClick={onSidebarToggle}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <FaBars aria-hidden="true" />
        </button>
      </div>
      <div className="header-clock" aria-live="polite">{formattedDateTime}</div>
      <nav className="header-actions" aria-label="Site navigation">
        <button
          className="theme-toggle"
          type="button"
          onClick={onThemeToggle}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <FaEye aria-hidden="true" /> : <FaEye aria-hidden="true" />}
        </button>
        {isAuthenticated ? (
          <>
            <Notifications
              onNotificationSelect={onNotificationSelect}
              requestNotifications={requestNotifications}
            />

            <div className="user-menu">
              <button
                className="user-card"
                type="button"
                onClick={() => setIsUserMenuOpen((open) => !open)}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="menu"
              >
                <span className="user-avatar" aria-hidden="true">{firstLetter}</span>
                <span className="user-name">{userDisplayName}</span>
                <FaChevronDown className="user-card-chevron" aria-hidden="true" />
              </button>
              {isUserMenuOpen && (
                <div className="user-dropdown" role="menu">
                  <span className="user-email">{currentUser.email}</span>
                  <button type="button" role="menuitem" onClick={() => {
                    onAccountSettings?.()
                    setIsUserMenuOpen(false)
                  }}>
                    Account settings
                  </button>
                  <button type="button" role="menuitem" onClick={requestNotifications?.toggleNotifications}>
                    {requestNotifications?.notificationsEnabled ? 'Mute notifications' : 'Unmute notifications'}
                  </button>
                  <button type="button" role="menuitem" onClick={onNavigate}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <button
            className="page-navigation"
            type="button"
            onClick={onNavigate}
            aria-label="Admin navigation"
            title="Admin navigation"
          >
            <FaShieldHalved aria-hidden="true" />
          </button>
        )}
      </nav>
    </header>
  )
}

export default Header
