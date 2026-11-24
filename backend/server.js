const cors = require('cors')
const cookieParser = require('cookie-parser')
const express = require('express')
const fs = require('fs')
const helmet = require('helmet')
const http = require('http')
const https = require('https')
const { clientOrigins, host, port, validateEnvironment } = require('./src/config/env')
const prisma = require('./src/config/prisma')
const { getSystemRuntime, startSystemRuntime, stopSystemRuntime } = require('./src/services/systemRuntime')
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
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
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
  if (!request.path.startsWith('/api')) {
    return next()
  }

  const startedAt = Date.now()
  response.on('finish', () => {
    console.log(`[API] ${request.method} ${request.originalUrl} -> ${response.statusCode} (${Date.now() - startedAt}ms)`)
  })

  return next()
})
app.use(cors(corsOptions))
app.use(cookieParser())
app.use(express.json())

app.get('/api/health', async (request, response) => {
  response.set('Cache-Control', 'no-store')
  try {
    await prisma.$queryRaw`SELECT 1`
    const runtime = await getSystemRuntime()
    return response.json({ status: 'ok', database: 'ok', ...runtime })
  } catch (error) {
    console.error('Unable to read system health:', error)
    return response.status(503).json({ status: 'degraded', database: 'offline' })
  }
})

app.use('/api/auth', authRoutes)
app.use('/api/requests', requestRoutes)
app.use('/api/admin', adminRoutes)

app.use((error, request, response, next) => {
  console.error(error)
  let status = 500
  let message = 'We could not complete this request. Please try again. If the problem continues, contact your administrator.'

  if (error.type === 'entity.parse.failed') {
    status = 400
    message = 'The request data could not be read. Check the file contents and try again.'
  } else if (error.type === 'entity.too.large') {
    status = 413
    message = 'The request is too large. Import fewer users at a time.'
  } else if (error.code === 'P2000') {
    status = 400
    message = 'One of the values is longer than allowed. Check the user details and try again.'
  } else if (error.code === 'P2002') {
    status = 409
    message = 'A user with the same employee ID or email already exists. Check for duplicate entries.'
  } else if (error.code === 'P2021' || error.code === 'P2022') {
    status = 503
    message = 'The database is missing an expected table or column. Apply pending database migrations and restart the backend.'
  } else if (error.code === 'P2025') {
    status = 404
    message = 'The requested user was not found. Refresh the user list and try again.'
  } else if (['P1001', 'P1002', 'P1017'].includes(error.code)) {
    status = 503
    message = 'The database is temporarily unavailable. Check the backend connection and try again.'
  }

  response.status(status).json({ message })
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
  : http.createServer(app)

httpServer.on('listening', () => {
  console.log(`Backend listening on ${host}:${port}${secureServer ? ' (HTTPS)' : ' (HTTP)'}`)
})

startSystemRuntime()
  .then(() => httpServer.listen(port, host))
  .catch((error) => {
    console.error('Unable to start system runtime tracking:', error)
    prisma.$disconnect().catch((disconnectError) => {
      console.error('Unable to disconnect Prisma after startup failure:', disconnectError)
    })
    process.exitCode = 1
  })

let isShuttingDown = false
async function shutdown() {
  if (isShuttingDown) return
  isShuttingDown = true
  try {
    await stopSystemRuntime()
  } catch (error) {
    console.error('Unable to finalize system runtime:', error)
  }
  await prisma.$disconnect()
  httpServer.close(() => process.exit(0))
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
