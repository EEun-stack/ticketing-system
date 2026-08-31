const express = require('express')
const rateLimit = require('express-rate-limit')
const { login, logout, getCurrentUser, getSession } = require('../controllers/authController')

const router = express.Router()

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again in a minute.' },
})

router.post('/login', authLimiter, login)
router.post('/logout', logout)
router.get('/session', getSession)
router.get('/me', getCurrentUser)

module.exports = router
