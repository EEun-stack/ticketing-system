const prisma = require('../../config/prisma')
const { recordActivity } = require('../../utils/activityLog')

async function deleteAdminUser(request, response, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: request.params.id },
      select: { email: true, name: true, role: true },
    })
    if (!user) return response.status(404).json({ message: 'Admin user not found.' })
    if (user.role !== 'ADMIN') {
      return response.status(400).json({ message: 'Only admin users can be deleted here.' })
    }

    await prisma.user.delete({ where: { id: request.params.id } })
    await recordActivity(request, {
      action: 'ADMIN_USER_DELETED',
      entityType: 'User',
      entityId: request.params.id,
      details: { email: user.email, name: user.name },
    })
    return response.json({ message: 'Admin user deleted.' })
  } catch (error) {
    return next(error)
  }
}

module.exports = deleteAdminUser