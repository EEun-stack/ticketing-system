const cors = require('cors')
const express = require('express')
const { clientOrigins, host, port, validateEnvironment } = require('./src/config/env')
const prisma = require('./src/config/prisma')
const authRoutes = require('./src/routes/authRoutes')
const requestRoutes = require('./src/routes/requestRoutes')
const adminRoutes = require('./src/routes/adminRoutes')

validateEnvironment()

const app = express()

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || clientOrigins.includes(origin)) {
      return callback(null, true)
    }

    return callback(new Error('Origin is not allowed by CORS'))
  },
}))
app.use(express.json())

app.get('/api/health', (request, response) => {
  prisma.$queryRaw`SELECT 1`
    .then(() => response.json({ status: 'ok', database: 'ok' }))
    .catch(() => response.status(503).json({ status: 'degraded', database: 'offline' }))
})

app.use('/api/auth', authRoutes)
app.use('/api/requests', requestRoutes)
app.use('/api/admin', adminRoutes)

app.use((error, request, response, next) => {
  console.error(error)
  response.status(500).json({ message: 'Internal server error.' })
})

const server = app.listen(port, host, () => {
  console.log(`Backend listening on ${host}:${port}`)
})

async function shutdown() {
  await prisma.$disconnect()
  server.close(() => process.exit(0))
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
