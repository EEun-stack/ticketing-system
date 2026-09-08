import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { api } from './api/config'
import Header from './components/header'
import useRequestNotifications from './hooks/useRequestNotifications'
import AdminHome from './pages/adminhome'
import SuperadminHome from './pages/superadminhome'

function ProtectedRoutes({ theme, onThemeToggle, onLogout }) {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [notificationTargetRequestId, setNotificationTargetRequestId] = useState(null)
  const requestNotifications = useRequestNotifications(Boolean(currentUser))

  function handleSidebarToggle() {
    if (window.innerWidth <= 768) {
      setMobileSidebarOpen((open) => !open)
      return
    }

    setSidebarCollapsed((collapsed) => !collapsed)
  }

  useEffect(() => {
    let isCancelled = false

    async function restoreSession() {
      try {
        const { data } = await api.get('/api/auth/me')

        if (isCancelled) {
          return
        }

        if (!isCancelled) {
          setCurrentUser(data)
        }
      } catch {
        if (!isCancelled) {
          setCurrentUser(null)
        }
      } finally {
        if (!isCancelled) {
          setIsCheckingAuth(false)
        }
      }
    }

    restoreSession()
    return () => {
      isCancelled = true
    }
  }, [])

  async function handleLogout() {
    setCurrentUser(null)
    setNotificationTargetRequestId(null)

    try {
      await api.post('/api/auth/logout')
    } catch (error) {
      console.error('Logout failed:', error)
    }

    onLogout?.()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    if (!currentUser) {
      document.title = 'Ticketing System'
      return
    }

    requestNotifications.updateTabNotificationIndicator()
  }, [currentUser, requestNotifications, requestNotifications.unreadCount, requestNotifications.updateTabNotificationIndicator])

  if (isCheckingAuth) {
    return null
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  return (
    <>
      <Header
        currentUser={currentUser}
        sidebarCollapsed={sidebarCollapsed}
        onSidebarToggle={handleSidebarToggle}
        onThemeToggle={onThemeToggle}
        onNavigate={handleLogout}
        onAccountSettings={() => setNotificationTargetRequestId('account-settings')}
        onNotificationSelect={(request) => {
          requestNotifications.markAsViewed(request.id)
          setNotificationTargetRequestId(request.id)
        }}
        requestNotifications={requestNotifications}
        theme={theme}
      />
      <div className="app-content with-header">
        {currentUser.role === 'SUPERADMIN' ? (
          <SuperadminHome
            canEditResolved
            currentUserId={currentUser.id}
            mobileSidebarOpen={mobileSidebarOpen}
            notificationTargetRequestId={notificationTargetRequestId}
            onNotificationTargetHandled={() => setNotificationTargetRequestId(null)}
            onRequestSelect={(request) => {
              requestNotifications.markAsViewed(request.id)
              setNotificationTargetRequestId(request.id)
            }}
            onMobileMenuClose={() => setMobileSidebarOpen(false)}
            requestNotifications={requestNotifications}
            sidebarCollapsed={sidebarCollapsed}
          />
        ) : (
          <AdminHome
            canEditResolved={false}
            currentUserId={currentUser.id}
            currentUserRole={currentUser.role}
            mobileSidebarOpen={mobileSidebarOpen}
            notificationTargetRequestId={notificationTargetRequestId}
            onNotificationTargetHandled={() => setNotificationTargetRequestId(null)}
            onRequestSelect={(request) => {
              requestNotifications.markAsViewed(request.id)
              setNotificationTargetRequestId(request.id)
            }}
            onMobileMenuClose={() => setMobileSidebarOpen(false)}
            requestNotifications={requestNotifications}
            sidebarCollapsed={sidebarCollapsed}
          />
        )}
      </div>
    </>
  )
}

export default ProtectedRoutes
