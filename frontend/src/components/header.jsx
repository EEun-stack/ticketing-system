import '../styles/header.css'
import { useState } from 'react'
import { FaBars, FaChevronDown, FaMoon, FaShieldHalved, FaSun, FaUser } from 'react-icons/fa6'

function Header({ currentUser, onThemeToggle, onNavigate, onSidebarToggle, sidebarCollapsed, theme }) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const isAuthenticated = Boolean(currentUser)
  const roleName = currentUser?.role === 'SUPERADMIN' ? 'Superadmin' : 'Admin'

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
                <button type="button" role="menuitem" onClick={onNavigate}>
                  Logout
                </button>
              </div>
            )}
          </div>
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
