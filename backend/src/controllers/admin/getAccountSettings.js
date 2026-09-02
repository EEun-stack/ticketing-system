const prisma = require('../../config/prisma')

async function getAccountSettings(request, response, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: request.auth.sub },
      select: { id: true, name: true, email: true, role: true, expertise: true, lastLoginAt: true },
    })
    if (!user) return response.status(404).json({ message: 'Account not found.' })
    return response.json({
      ...user,
      expertise: Array.isArray(user.expertise) ? user.expertise : user.expertise ? [user.expertise] : [],
    })
  } catch (error) {
    return next(error)
  }
}

module.exports = getAccountSettings