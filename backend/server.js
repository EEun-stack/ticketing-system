const cors = require('cors')
const cookieParser = require('cookie-parser')
const express = require('express')
const fs = require('fs')
const helmet = require('helmet')
const https = require('https')
const { clientOrigins, host, port, validateEnvironment } = require('./src/config/env')
const prisma = require('./src/config/prisma')
const authRoutes = require('./src/routes/authRoutes')
const requestRoutes = require('./src/routes/requestRoutes')
const adminRoutes = require('./src/routes/adminRoutes')

validateEnvironment()

const allowedOrigins = new Set(clientOrigins)
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, false)
    }

    if (allowedOrigins.has(origin)) {
      return callback(null, true)
    }

    return callback(new Error('Origin is not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
}

const app = express()
app.set('trust proxy', 1)
app.disable('x-powered-by')
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false,
}))
app.use((request, response, next) => {
  if (request.method === 'OPTIONS') {
    response.header('Access-Control-Allow-Origin', request.headers.origin || '*')
    response.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
    response.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.header('Access-Control-Allow-Credentials', 'true')
    return response.sendStatus(204)
  }

  return next()
})
app.use(cors(corsOptions))
app.use(cookieParser())
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

const secureServer = Boolean(process.env.HTTPS_KEY_PATH) && Boolean(process.env.HTTPS_CERT_PATH)
const httpServer = secureServer
  ? https.createServer(
      {
        key: fs.readFileSync(process.env.HTTPS_KEY_PATH),
        cert: fs.readFileSync(process.env.HTTPS_CERT_PATH),
      },
      app,
    )
  : app.listen(port, host)

httpServer.on('listening', () => {
  console.log(`Backend listening on ${host}:${port}${secureServer ? ' (HTTPS)' : ' (HTTP)'}`)
})

async function shutdown() {
  await prisma.$disconnect()
  httpServer.close(() => process.exit(0))
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
