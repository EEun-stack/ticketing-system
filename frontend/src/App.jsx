import { useEffect, useState } from 'react'
import Header from './components/header'
import AdminHome from './pages/adminhome'
import GuestRequestForm from './pages/form'
import LoginPage from './pages/loginpage'
import {
  clearAuthSession,
  getStoredTheme,
  getStoredUser,
  saveTheme,
} from './services/authStorage'
import SuperadminHome from './pages/superadminhome'

function App() {
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [currentUser, setCurrentUser] = useState(getStoredUser)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [theme, setTheme] = useState(getStoredTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    saveTheme(theme)
  }, [theme])

  return (
    <>
      {currentUser && (
        <Header
          currentUser={currentUser}
          sidebarCollapsed={sidebarCollapsed}
          onSidebarToggle={() => setSidebarCollapsed((collapsed) => !collapsed)}
          onThemeToggle={() => setTheme((currentTheme) => currentTheme === 'light' ? 'dark' : 'light')}
          onNavigate={() => {
            setCurrentUser(null)
            clearAuthSession()
            setShowAdminLogin(true)
          }}
          theme={theme}
        />
      )}
      <div className={`app-content ${currentUser ? 'with-header' : ''}`}>
        {currentUser ? (
          currentUser.role === 'SUPERADMIN' ? (
            <SuperadminHome
              sidebarCollapsed={sidebarCollapsed}
            />
          ) : (
            <AdminHome
              sidebarCollapsed={sidebarCollapsed}
            />
          )
        ) : showAdminLogin ? (
          <LoginPage
            onGoToForms={() => setShowAdminLogin(false)}
            onLoginSuccess={(user) => {
              setCurrentUser(user)
              setShowAdminLogin(false)
            }}
          />
        ) : (
          <GuestRequestForm
            onAdminLogin={() => setShowAdminLogin(true)}
            onThemeToggle={() => setTheme((currentTheme) => currentTheme === 'light' ? 'dark' : 'light')}
            theme={theme}
          />
        )}
      </div>
    </>
  )
}

export default App
