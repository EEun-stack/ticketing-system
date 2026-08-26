const AUTH_TOKEN_KEY = 'authToken'
const AUTH_USER_KEY = 'authUser'
const THEME_KEY = 'theme'

function getStoredUser() {
  try {
    const storedUser = localStorage.getItem(AUTH_USER_KEY)
    return storedUser ? JSON.parse(storedUser) : null
  } catch {
    localStorage.removeItem(AUTH_USER_KEY)
    return null
  }
}

function getStoredTheme() {
  return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
}

function saveAuthSession(token, user) {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

function clearAuthSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
}

function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme)
}

export {
  clearAuthSession,
  getStoredTheme,
  getStoredUser,
  saveAuthSession,
  saveTheme,
}
