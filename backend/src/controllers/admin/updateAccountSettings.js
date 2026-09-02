const bcrypt = require('bcryptjs')
const prisma = require('../../config/prisma')
const { recordActivity } = require('../../utils/activityLog')

async function updateAccountSettings(request, response, next) {
  const name = String(request.body.name || '').trim()
  const email = String(request.body.email || '').trim().toLowerCase()
  const expertise = Array.isArray(request.body.expertise)
    ? request.body.expertise
    : typeof request.body.expertise === 'string' && request.body.expertise.trim()
      ? [request.body.expertise]
      : []
  const currentPassword = String(request.body.currentPassword || '')
  const newPassword = String(request.body.newPassword || '')

  if (!name || !email || !currentPassword) {
    return response.status(400).json({ message: 'Name, email, and current password are required.' })
  }
  if (newPassword && newPassword.length < 8) {
    return response.status(400).json({ message: 'New password must be at least 8 characters.' })
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: request.auth.sub } })
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return response.status(401).json({ message: 'Current password is incorrect.' })
    }

    const normalizedExpertise = expertise
      .map((value) => String(value).trim())
      .filter(Boolean)

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        email,
        expertise: normalizedExpertise,
        ...(newPassword ? { passwordHash: await bcrypt.hash(newPassword, 12) } : {}),
      },
      select: { id: true, name: true, email: true, role: true, expertise: true, lastLoginAt: true },
    })
    await recordActivity(request, {
      action: 'ACCOUNT_UPDATED',
      entityType: 'User',
      entityId: updated.id,
      details: { name: updated.name, email: updated.email, expertise: updated.expertise, passwordChanged: Boolean(newPassword) },
    })
    return response.json(updated)
  } catch (error) {
    if (error.code === 'P2002') return response.status(409).json({ message: 'That email is already in use.' })
    return next(error)
  }
}

module.exports = updateAccountSettings