import { useEffect, useState } from 'react'
import Footer from './components/footer'
import Header from './components/header'
import useRequestNotifications from './hooks/useRequestNotifications'
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
  const [notificationTargetRequestId, setNotificationTargetRequestId] = useState(null)
  const requestNotifications = useRequestNotifications(Boolean(currentUser))

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
          onAccountSettings={() => setNotificationTargetRequestId('account-settings')}
          onNotificationSelect={(request) => {
            requestNotifications.markAsViewed(request.id)
            setNotificationTargetRequestId(request.id)
          }}
          requestNotifications={requestNotifications}
          theme={theme}
        />
      )}
      <div className={`app-content ${currentUser ? 'with-header' : ''}`}>
        {currentUser ? (
          currentUser.role === 'SUPERADMIN' ? (
            <SuperadminHome
              canEditResolved
              notificationTargetRequestId={notificationTargetRequestId}
              onNotificationTargetHandled={() => setNotificationTargetRequestId(null)}
              requestNotifications={requestNotifications}
              sidebarCollapsed={sidebarCollapsed}
            />
          ) : (
            <AdminHome
              canEditResolved={false}
              notificationTargetRequestId={notificationTargetRequestId}
              requestNotifications={requestNotifications}
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
