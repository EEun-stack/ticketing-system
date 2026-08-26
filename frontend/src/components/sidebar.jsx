import '../styles/sidebar.css'
import { FaChartSimple, FaGear, FaTicket } from 'react-icons/fa6'
import ftiLogo from '../assets/fti_logo.png'
import ftiCollapsedLogo from '../assets/fti_logo_collapse.png'

const sidebarTabs = [
  { id: 'dashboard', label: 'Dashboard', icon: FaChartSimple },
  { id: 'requests', label: 'Requests', icon: FaTicket },
  { id: 'settings', label: 'Settings', icon: FaGear },
]

function Sidebar({ activeTab = 'dashboard', collapsed = false, onTabChange }) {
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
        {sidebarTabs.map(({ id, label, icon: Icon }) => (
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
          </button>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
