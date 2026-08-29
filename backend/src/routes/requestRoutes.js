const express = require('express')
const rateLimit = require('express-rate-limit')
const { createRequest, getSettings } = require('../controllers/requestController')

const router = express.Router()

const formLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many form submissions. Please wait a minute and try again.' },
})

router.get('/settings', getSettings)
router.post('/', formLimiter, createRequest)

module.exports = router