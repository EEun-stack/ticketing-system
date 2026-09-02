const jwt = require('jsonwebtoken')
const { loginUser } = require('../services/authService')

function getCookieOptions(request = {}) {
  const origin = request.headers?.origin || ''
  const isHttpsOrigin = origin.startsWith('https://')
  const isLocalNetworkOrigin = /localhost|127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.|\.local$|\.lan$|\.fti\.local$/.test(origin)
  const isSecure = Boolean(process.env.HTTPS_KEY_PATH) || process.env.NODE_ENV === 'production' || isHttpsOrigin
  const isCrossSite = Boolean(origin) && !origin.includes('localhost') && !origin.includes('127.0.0.1') && !isLocalNetworkOrigin

  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: isCrossSite && isSecure ? 'none' : 'lax',
    path: '/',
  }
}

function setAuthCookie(response, token, request) {
  response.cookie('authToken', token, {
    ...getCookieOptions(request),
    maxAge: 24 * 60 * 60 * 1000,
  })
}

async function login(request, response) {
  const { email, password } = request.body || {}

  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return response.status(400).json({ message: 'Email and password are required.' })
  }

  const result = await loginUser(email.trim(), password, request)

  if (!result) {
    return response.status(401).json({ message: 'Invalid email or password.' })
  }

  setAuthCookie(response, result.token, request)
  return response.json({ token: result.token, user: result.user })
}

function logout(request, response) {
  response.clearCookie('authToken', getCookieOptions(request))
  return response.json({ message: 'Logged out.' })
}

function getCurrentUser(request, response) {
  const token = request.cookies?.authToken || request.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return response.status(401).json({ message: 'Authentication required.' })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    return response.json({
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    })
  } catch {
    return response.status(401).json({ message: 'Invalid or expired token.' })
  }
}

function getSession(request, response) {
  const token = request.cookies?.authToken || request.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return response.json({ user: null })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    return response.json({
      user: {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role,
      },
    })
  } catch {
    return response.json({ user: null })
  }
}

module.exports = { getCurrentUser, getSession, login, logout }
