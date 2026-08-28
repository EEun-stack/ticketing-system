const { loginUser } = require('../services/authService')

async function login(request, response) {
  const { email, password } = request.body || {}

  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return response.status(400).json({ message: 'Email and password are required.' })
  }

  const result = await loginUser(email.trim(), password, request)

  if (!result) {
    return response.status(401).json({ message: 'Invalid email or password.' })
  }

  return response.json(result)
}

module.exports = { login }
