const prisma = require('../../config/prisma')

async function listAdminUsers(request, response, next) {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, createdAt: true },
    })
    return response.json(users)
  } catch (error) {
    return next(error)
  }
}

module.exports = listAdminUsers