const bcrypt = require('bcryptjs')
const prisma = require('../../config/prisma')
const { recordActivity } = require('../../utils/activityLog')

async function createAdminUser(request, response, next) {
  const name = String(request.body.name || '').trim()
  const email = String(request.body.email || '').trim().toLowerCase()
  const password = String(request.body.password || '')

  if (!name || !email || !password || password.length < 8) {
    return response.status(400).json({ message: 'Name, email, and an 8-character password are required.' })
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: 'ADMIN' },
      select: { id: true, name: true, email: true, createdAt: true },
    })
    await recordActivity(request, {
      action: 'ADMIN_USER_CREATED',
      entityType: 'User',
      entityId: user.id,
      details: { name: user.name, email: user.email },
    })
    return response.status(201).json(user)
  } catch (error) {
    if (error.code === 'P2002') {
      return response.status(409).json({ message: 'An admin user with that email already exists.' })
    }
    return next(error)
  }
}

module.exports = createAdminUser