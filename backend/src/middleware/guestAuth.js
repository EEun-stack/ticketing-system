const jwt = require('jsonwebtoken')
const prisma = require('../config/prisma')

async function requireGuestAuth(request, response, next) {
  const token = request.cookies?.guestAuthToken
  if (!token) return response.status(401).json({ message: 'Guest sign-in required.' })

  let payload
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return response.status(401).json({ message: 'Guest session is invalid or expired. Please sign in again.' })
  }

  if (payload.role !== 'GUEST' || !payload.sub) {
    return response.status(401).json({ message: 'Guest session is invalid. Please sign in again.' })
  }

  try {
    const employee = await prisma.employeeDirectoryEntry.findUnique({
      where: { id: payload.sub },
      select: { id: true, employeeId: true, name: true, isActive: true },
    })
    if (!employee || !employee.isActive) {
      return response.status(401).json({ message: 'This guest account is inactive. Please contact an administrator.' })
    }

    request.guest = employee
    return next()
  } catch (error) {
    return next(error)
  }
}

module.exports = { requireGuestAuth }
