const dotenv = require('dotenv')

dotenv.config()

const requiredEnvironmentVariables = ['DATABASE_URL', 'JWT_SECRET']

function validateEnvironment() {
  const missingVariables = requiredEnvironmentVariables.filter(
    (variable) => !process.env[variable],
  )

  if (missingVariables.length > 0) {
    throw new Error(`Missing environment variables: ${missingVariables.join(', ')}`)
  }
}

module.exports = {
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  port: Number(process.env.PORT) || 5000,
  validateEnvironment,
}
