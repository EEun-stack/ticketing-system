const express = require('express')
const { createRequest, getSettings } = require('../controllers/requestController')

const router = express.Router()

router.get('/settings', getSettings)
router.post('/', createRequest)

module.exports = router