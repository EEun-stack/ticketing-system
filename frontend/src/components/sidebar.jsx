import { FaChartSimple, FaGear, FaTicket, FaUsersGear } from 'react-icons/fa6'
import ftiLogo from '../assets/fti_logo.png'
import ftiCollapsedLogo from '../assets/fti_logo_collapse.png'
import '../styles/sidebar.css'

const sidebarTabs = [
  { id: 'dashboard', label: 'Dashboard', icon: FaChartSimple },
  { id: 'requests', label: 'Requests', icon: FaTicket },
  { id: 'admin-users', label: 'Admin Users', icon: FaUsersGear },
  { id: 'settings', label: 'Settings', icon: FaGear },
]

function Sidebar({
  activeTab = 'dashboard',
  collapsed = false,
  isOnline = false,
  onTabChange,
  showSuperadminTabs = false,
  unreadRequestCount = 0,
}) {
  const visibleTabs = showSuperadminTabs
    ? sidebarTabs
    : sidebarTabs.filter(({ id }) => !["settings", "admin-users"].includes(id))

  return (
    <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''}`} aria-label="Admin navigation">
      <div className="sidebar-top">
        <img
          className="sidebar-logo"
          src={collapsed ? ftiCollapsedLogo : ftiLogo}
          alt="FTI"
        />
      </div>
      <nav className="sidebar-nav">
        {visibleTabs.map(({ id, label, icon: Icon }) => (
          <button
            className={`sidebar-tab ${activeTab === id ? 'active' : ''}`}
            type="button"
            key={id}
            onClick={() => onTabChange?.(id)}
            aria-label={label}
            title={label}
            aria-current={activeTab === id ? 'page' : undefined}
          >
            <Icon aria-hidden="true" />
            <span className="sidebar-label">{label}</span>
            {id === 'requests' && unreadRequestCount > 0 && (
              <span className="sidebar-badge">
                {unreadRequestCount > 99 ? '99+' : unreadRequestCount}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className={`system-status ${isOnline ? 'online' : 'offline'}`} role="status">
        <span className="system-status-dot" aria-hidden="true" />
        <span className="system-status-label">System {isOnline ? 'Online' : 'Offline'}</span>
      </div>
    </aside>
  )
}

export default Sidebar
