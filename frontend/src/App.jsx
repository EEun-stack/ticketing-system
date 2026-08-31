import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { api } from './api/config'
import ProtectedRoutes from './ProtectedRoutes'
import GuestRequestForm from './pages/form'
import LoginPage from './pages/loginpage'
import { getStoredTheme, saveTheme } from './services/authStorage'

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
      <Route
        path="/"
        element={
          <AuthGate>
            <GuestRequestForm
              onAdminLogin={() => navigate('/login', { replace: true })}
              onThemeToggle={() => setTheme((currentTheme) => currentTheme === 'light' ? 'dark' : 'light')}
              theme={theme}
            />
          </AuthGate>
        }
      />
      <Route
        path="/login"
        element={
          <AuthGate redirectTo="/dashboard">
            <LoginPage
              onGoToForms={() => navigate('/', { replace: true })}
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
