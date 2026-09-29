import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { api } from './api/config'
import ProtectedRoutes from './ProtectedRoutes'
import GuestRequestForm from './pages/form'
import GuestHome from './pages/guesthome'
import GuestLoginPage from './pages/guestloginpage'
import LoginPage from './pages/loginpage'
import { getStoredTheme, saveTheme } from './services/authStorage'

const guestEmployeeIdKey = 'guestEmployeeId'

function getGuestEmployeeId() {
  try {
    return localStorage.getItem(guestEmployeeIdKey) || ''
  } catch {
    return ''
  }
}

function GuestGate({ children }) {
  return getGuestEmployeeId() ? children : <Navigate to="/user-login" replace />
}

function AuthGate({ children, redirectTo = '/dashboard' }) {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let isCancelled = false

    async function checkSession() {
      try {
        const { data } = await api.get('/api/auth/session')

        if (isCancelled) {
          return
        }

        if (data?.user) {
          navigate(redirectTo, { replace: true })
          return
        }
      } catch {
        // Ignore and allow public page to render.
      } finally {
        if (!isCancelled) {
          setReady(true)
        }
      }
    }

    checkSession()
    return () => {
      isCancelled = true
    }
  }, [navigate, redirectTo])

  if (!ready) {
    return null
  }

  return children
}

function App() {
  const navigate = useNavigate()
  const [theme, setTheme] = useState(getStoredTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    saveTheme(theme)
  }, [theme])

  return (
    <Routes>
      <Route path="/" element={<Navigate to={getGuestEmployeeId() ? '/home' : '/user-login'} replace />} />
      <Route
        path="/user-login"
        element={
          <GuestLoginPage
            onAdminLogin={() => navigate('/login')}
            onLoginSuccess={() => navigate('/home', { replace: true })}
            onThemeToggle={() => setTheme((currentTheme) => currentTheme === 'light' ? 'dark' : 'light')}
            theme={theme}
          />
        }
      />
      <Route
        path="/home"
        element={
          <GuestGate>
            <GuestHome
              employeeId={getGuestEmployeeId()}
              onLogout={() => {
                localStorage.removeItem(guestEmployeeIdKey)
                navigate('/user-login', { replace: true })
              }}
              onOpenForm={(form) => navigate(`/form/${form}`)}
              onThemeToggle={() => setTheme((currentTheme) => currentTheme === 'light' ? 'dark' : 'light')}
              theme={theme}
            />
          </GuestGate>
        }
      />
      <Route
        path="/form/ticket"
        element={
          <GuestGate>
            <GuestRequestForm
              key="ticket"
              employeeId={getGuestEmployeeId()}
              initialForm="ticket"
              onHome={() => navigate('/home')}
              onThemeToggle={() => setTheme((currentTheme) => currentTheme === 'light' ? 'dark' : 'light')}
              theme={theme}
            />
          </GuestGate>
        }
      />
      <Route
        path="/form/board-room"
        element={
          <GuestGate>
            <GuestRequestForm
              key="board-room"
              employeeId={getGuestEmployeeId()}
              initialForm="board-room"
              onHome={() => navigate('/home')}
              onThemeToggle={() => setTheme((currentTheme) => currentTheme === 'light' ? 'dark' : 'light')}
              theme={theme}
            />
          </GuestGate>
        }
      />
      <Route
        path="/login"
        element={
          <AuthGate redirectTo="/dashboard">
            <LoginPage
              onGoToForms={() => navigate('/user-login', { replace: true })}
              onLoginSuccess={() => navigate('/dashboard', { replace: true })}
            />
          </AuthGate>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoutes
            theme={theme}
            onThemeToggle={() => setTheme((currentTheme) => currentTheme === 'light' ? 'dark' : 'light')}
            onLogout={() => navigate('/login', { replace: true })}
          />
        }
      />
      <Route path="*" element={<Navigate to="/user-login" replace />} />
    </Routes>
  )
}

export default App
