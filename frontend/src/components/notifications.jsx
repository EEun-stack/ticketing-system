import { useState } from 'react'
import { FaBell } from 'react-icons/fa6'
import { getRequestTitle } from '../utils/requestDisplay'

function Notifications({ onNotificationSelect, requestNotifications }) {
  const [isOpen, setIsOpen] = useState(false)
  const unreadCount = requestNotifications?.unreadCount || 0
  const unreadRequests = requestNotifications?.unreadRequests || []
  const badgeLabel = unreadCount > 99 ? '99+' : unreadCount

  return (
    <div className="notification-menu">
      <button
        className="notification-button"
        type="button"
        onClick={() => {
          requestNotifications?.requestPermission?.()
          setIsOpen((open) => !open)
        }}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Notifications"
        title="Notifications"
      >
        <FaBell aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="notification-badge">{badgeLabel}</span>
        )}
      </button>
      {isOpen && (
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
                  setIsOpen(false)
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
  )
}

export default Notifications
