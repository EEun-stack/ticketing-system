const AUTH_USER_KEY = 'authUser'
const THEME_KEY = 'theme'
const ACTIVE_TAB_PREFIX = 'activeTab:'

function getStoredUser() {
  try {
    const storedUser = localStorage.getItem(AUTH_USER_KEY)
    if (!storedUser) {
      return null
    }

    return JSON.parse(storedUser)
  } catch {
    localStorage.removeItem(AUTH_USER_KEY)
    return null
  }
}

function getStoredTheme() {
  return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
}

function getAuthToken() {
  return null
}

function saveAuthSession(user) {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
}

function clearAuthSession() {
  localStorage.removeItem(AUTH_USER_KEY)
}

function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme)
}

function getStoredActiveTab(role, allowedTabs) {
  try {
    const storedTab = localStorage.getItem(`${ACTIVE_TAB_PREFIX}${role}`)
    if (storedTab === 'account-settings') {
      return allowedTabs[0]
    }
    return allowedTabs.includes(storedTab) ? storedTab : allowedTabs[0]
  } catch {
    return allowedTabs[0]
  }
}

function saveActiveTab(role, tab) {
  if (tab === 'account-settings') {
    return
  }

  localStorage.setItem(`${ACTIVE_TAB_PREFIX}${role}`, tab)
}

export {
  clearAuthSession,
  getAuthToken,
  getStoredTheme,
  getStoredActiveTab,
  getStoredUser,
  saveAuthSession,
  saveActiveTab,
  saveTheme,
}
