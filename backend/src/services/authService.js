const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../config/prisma')
const { jwtExpiresIn } = require('../config/env')

async function loginUser(email, password) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  })

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return null
  }

  const token = jwt.sign(
    { role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: jwtExpiresIn, subject: user.id },
  )

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
