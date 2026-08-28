import { useState } from 'react'
import {
  FaBars,
  FaBell,
  FaChevronDown,
  FaMoon,
  FaShieldHalved,
  FaSun,
  FaUser,
} from 'react-icons/fa6'
import { getRequestTitle } from '../utils/requestDisplay'
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
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const isAuthenticated = Boolean(currentUser)
  const roleName = currentUser?.role === 'SUPERADMIN' ? 'Superadmin' : 'Admin'
  const unreadCount = requestNotifications?.unreadCount || 0
  const unreadRequests = requestNotifications?.unreadRequests || []
  const badgeLabel = unreadCount > 99 ? '99+' : unreadCount

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
      <nav className="header-actions" aria-label="Site navigation">
        <button
          className="theme-toggle"
          type="button"
          onClick={onThemeToggle}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <FaMoon aria-hidden="true" /> : <FaSun aria-hidden="true" />}
        </button>
        {isAuthenticated ? (
          <>
            <div className="notification-menu">
              <button
                className="notification-button"
                type="button"
                onClick={() => {
                  requestNotifications?.requestPermission?.()
                  setIsNotificationOpen((open) => !open)
                }}
                aria-expanded={isNotificationOpen}
                aria-haspopup="menu"
                aria-label="Notifications"
                title="Notifications"
              >
                <FaBell aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="notification-badge">{badgeLabel}</span>
                )}
              </button>
              {isNotificationOpen && (
                <div className="notification-dropdown" role="menu">
                  <div className="notification-dropdown-heading">
                    <strong>Notifications</strong>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={requestNotifications?.markAllAsViewed}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  {requestNotifications?.permission !== 'granted' && (
                    <button
                      className="notification-permission"
                      type="button"
                      onClick={requestNotifications?.enableDesktopNotifications}
                    >
                      {requestNotifications?.permission === 'denied'
                        ? 'Allow desktop alerts in browser settings'
                        : 'Enable desktop alerts'}
                    </button>
                  )}
                  {unreadRequests.length ? (
                    unreadRequests.slice(0, 6).map((request) => (
                      <button
                        className="notification-item"
                        type="button"
                        key={request.id}
                        role="menuitem"
                        onClick={() => {
                          onNotificationSelect?.(request)
                          setIsNotificationOpen(false)
                        }}
                      >
                        <strong>{getRequestTitle(request)}</strong>
                        <span>{request.employeeName}</span>
                        <small>{new Date(request.createdAt).toLocaleString()}</small>
                      </button>
                    ))
                  ) : (
                    <p className="notification-empty">No new requests.</p>
                  )}
                </div>
              )}
            </div>

            <div className="user-menu">
              <button
                className="user-card"
                type="button"
                onClick={() => setIsUserMenuOpen((open) => !open)}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="menu"
              >
                <FaUser aria-hidden="true" />
                <span>{roleName}</span>
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
