const bcrypt = require('bcryptjs')
const prisma = require('../../config/prisma')
const { recordActivity } = require('../../utils/activityLog')

async function updateAdminUser(request, response, next) {
  const userId = request.params.id
  const name = String(request.body.name || '').trim()
  const email = String(request.body.email || '').trim().toLowerCase()
  const expertise = Array.isArray(request.body.expertise)
    ? request.body.expertise
    : typeof request.body.expertise === 'string' && request.body.expertise.trim()
      ? [request.body.expertise]
      : []
  const password = String(request.body.password || '')

  if (!userId || !name || !email) {
    return response.status(400).json({ message: 'Name and email are required.' })
  }

  if (password && password.length < 8) {
    return response.status(400).json({ message: 'Password must be at least 8 characters.' })
  }

  try {
    const existing = await prisma.user.findUnique({ where: { id: userId } })
    if (!existing) {
      return response.status(404).json({ message: 'Admin user not found.' })
    }

    const normalizedExpertise = expertise
      .map((value) => String(value).trim())
      .filter(Boolean)

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        expertise: normalizedExpertise,
        ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}),
      },
      select: { id: true, name: true, email: true, expertise: true, createdAt: true, lastLoginAt: true },
    })

    await recordActivity(request, {
      action: 'ADMIN_USER_UPDATED',
      entityType: 'User',
      entityId: updated.id,
      details: { name: updated.name, email: updated.email, expertise: updated.expertise, passwordChanged: Boolean(password) },
    })

    return response.json(updated)
  } catch (error) {
    if (error.code === 'P2002') {
      return response.status(409).json({ message: 'An admin user with that email already exists.' })
    }
    return next(error)
  }
}

module.exports = updateAdminUser
