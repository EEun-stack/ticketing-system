const jwt = require('jsonwebtoken')
const prisma = require('../config/prisma')

async function requireAuth(request, response, next) {
  const token = request.cookies?.authToken || request.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return response.status(401).json({ message: 'Authentication required.' })
  }

  let payload
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return response.status(401).json({ message: 'Invalid or expired token.' })
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { role: true, isActive: true },
  })
  if (!user || !user.isActive) {
    return response.status(401).json({ message: 'This account is inactive.' })
  }

  request.auth = { ...payload, role: user.role }
  return next()
}

function requireSuperadmin(request, response, next) {
  if (request.auth?.role !== 'SUPERADMIN') {
    return response.status(403).json({ message: 'Superadmin access required.' })
  }

  return next()
}

module.exports = { requireAuth, requireSuperadmin }