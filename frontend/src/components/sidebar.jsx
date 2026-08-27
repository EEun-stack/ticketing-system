import { useEffect, useState } from 'react'
import { FaChartSimple, FaGear, FaTicket } from 'react-icons/fa6'
import ftiLogo from '../assets/fti_logo.png'
import ftiCollapsedLogo from '../assets/fti_logo_collapse.png'
import '../styles/sidebar.css'

const sidebarTabs = [
  { id: 'dashboard', label: 'Dashboard', icon: FaChartSimple },
  { id: 'requests', label: 'Requests', icon: FaTicket },
  { id: 'settings', label: 'Settings', icon: FaGear },
]

function Sidebar({ activeTab = 'dashboard', collapsed = false, onTabChange }) {
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function checkBackend() {
      const controller = new AbortController()
      const timeout = window.setTimeout(() => controller.abort(), 5000)

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/health`,
          { signal: controller.signal, cache: 'no-store' },
        )

        if (isMounted) {
          setIsOnline(response.ok)
        }
      } catch {
        if (isMounted) {
          setIsOnline(false)
        }
      } finally {
        window.clearTimeout(timeout)
      }
    }

    const handleConnectionChange = () => checkBackend()

    checkBackend()
    const healthCheckInterval = window.setInterval(checkBackend, 10000)
    window.addEventListener('online', handleConnectionChange)
    window.addEventListener('offline', handleConnectionChange)

    return () => {
      isMounted = false
      window.clearInterval(healthCheckInterval)
      window.removeEventListener('online', handleConnectionChange)
      window.removeEventListener('offline', handleConnectionChange)
    }
  }, [])

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
      <div className={`system-status ${isOnline ? 'online' : 'offline'}`} role="status">
        <span className="system-status-dot" aria-hidden="true" />
        <span className="system-status-label">System {isOnline ? 'Online' : 'Offline'}</span>
      </div>
    </aside>
  )
}

export default Sidebar
