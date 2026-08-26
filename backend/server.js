const cors = require('cors')
const express = require('express')
const { clientOrigin, port, validateEnvironment } = require('./src/config/env')
const prisma = require('./src/config/prisma')
const authRoutes = require('./src/routes/authRoutes')

validateEnvironment()

const app = express()

app.use(cors({ origin: clientOrigin }))
app.use(express.json())

app.get('/api/health', (request, response) => {
  response.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)

app.use((error, request, response, next) => {
  console.error(error)
  response.status(500).json({ message: 'Internal server error.' })
})

const server = app.listen(port, () => {
  console.log(`Backend listening on port ${port}`)
})

async function shutdown() {
  await prisma.$disconnect()
  server.close(() => process.exit(0))
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
