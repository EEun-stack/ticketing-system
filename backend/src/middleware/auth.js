const jwt = require('jsonwebtoken')

function requireAuth(request, response, next) {
  const token = request.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return response.status(401).json({ message: 'Authentication required.' })
  }

  try {
    request.auth = jwt.verify(token, process.env.JWT_SECRET)
    return next()
  } catch {
    return response.status(401).json({ message: 'Invalid or expired token.' })
  }
}

function requireSuperadmin(request, response, next) {
  if (request.auth?.role !== 'SUPERADMIN') {
    return response.status(403).json({ message: 'Superadmin access required.' })
  }

  return next()
}

module.exports = { requireAuth, requireSuperadmin }