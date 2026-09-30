const prisma = require('../../config/prisma')

async function listAdminUsers(request, response, next) {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, unit: true, isActive: true, expertise: true, createdAt: true, lastLoginAt: true },
    })
    const requests = users.length
      ? await prisma.supportRequest.findMany({
        where: { claimedById: { in: users.map((user) => user.id) } },
        orderBy: { createdAt: 'desc' },
        select: { claimedById: true, department: true, createdAt: true },
      })
      : []
    const latestRequestByAdmin = new Map()
    for (const request of requests) {
      if (request.claimedById && !latestRequestByAdmin.has(request.claimedById)) {
        latestRequestByAdmin.set(request.claimedById, request)
      }
    }

    return response.json(users.map((user) => {
      const lastRequest = latestRequestByAdmin.get(user.id)
      return {
        ...user,
        unit: user.unit || lastRequest?.department || null,
        lastRequestAt: lastRequest?.createdAt || null,
        isActive: user.isActive,
      }
    }))
  } catch (error) {
    return next(error)
  }
}

module.exports = listAdminUsers