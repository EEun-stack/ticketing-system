const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../config/prisma')
const { jwtExpiresIn } = require('../config/env')
const { recordActivity } = require('../utils/activityLog')

async function loginUser(email, password, request) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  })

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    await recordActivity(request, {
      action: 'USER_LOGIN_FAILED',
      entityType: 'User',
      details: { email: email.toLowerCase() },
    })
    return null
  }

  const token = jwt.sign(
    { email: user.email, name: user.name || user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: jwtExpiresIn, subject: user.id },
  )

  await recordActivity(request, {
    action: 'USER_LOGIN',
    entityType: 'User',
    entityId: user.id,
    details: { role: user.role },
    actor: { actorId: user.id, actorName: user.name || user.email, actorEmail: user.email },
  })

  return {
    token,
    user: {
      email: user.email,
      id: user.id,
      name: user.name || user.email,
      role: user.role,
    },
  }
}

module.exports = { loginUser }
