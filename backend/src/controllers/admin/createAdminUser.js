const bcrypt = require('bcryptjs')
const prisma = require('../../config/prisma')
const { recordActivity } = require('../../utils/activityLog')

async function createAdminUser(request, response, next) {
  const name = String(request.body.name || '').trim()
  const email = String(request.body.email || '').trim().toLowerCase()
  const unit = String(request.body.unit || '').trim()
  const isActive = typeof request.body.isActive === 'boolean' ? request.body.isActive : true
  const expertise = Array.isArray(request.body.expertise)
    ? request.body.expertise
    : typeof request.body.expertise === 'string' && request.body.expertise.trim()
      ? [request.body.expertise]
      : []
  const password = String(request.body.password || '')

  if (!name || !email || !password || password.length < 8) {
    return response.status(400).json({ message: 'Name, email, and an 8-character password are required.' })
  }
  if (unit.length > 160) {
    return response.status(400).json({ message: 'Unit must be 160 characters or fewer.' })
  }

  try {
    const normalizedExpertise = expertise
      .map((value) => String(value).trim())
      .filter(Boolean)

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { name, email, unit: unit || null, isActive, expertise: normalizedExpertise, passwordHash, role: 'ADMIN' },
      select: { id: true, name: true, email: true, unit: true, isActive: true, expertise: true, createdAt: true, lastLoginAt: true },
    })
    await recordActivity(request, {
      action: 'ADMIN_USER_CREATED',
      entityType: 'User',
      entityId: user.id,
      details: { name: user.name, email: user.email, unit: user.unit, isActive: user.isActive },
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