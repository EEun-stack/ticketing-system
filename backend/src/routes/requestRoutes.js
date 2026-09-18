const express = require('express')
const rateLimit = require('express-rate-limit')
const { createRequest, getRequestStatus, getSettings, submitFeedback } = require('../controllers/requestController')
const { createBooking, getBookingStatus, listAvailability } = require('../controllers/boardRoomController')

const router = express.Router()

const formLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many form submissions. Please wait a minute and try again.' },
})

router.get('/settings', getSettings)
router.get('/board-room/availability', listAvailability)
router.post('/board-room', formLimiter, createBooking)
router.get('/board-room/:id', getBookingStatus)
router.post('/:id/feedback', formLimiter, submitFeedback)
router.get('/:id', getRequestStatus)
router.post('/', formLimiter, createRequest)

module.exports = router