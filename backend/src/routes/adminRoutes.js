const express = require('express')
const { requireAuth, requireSuperadmin } = require('../middleware/auth')
const {
  getAdminSettings, getAnalytics, listRequests, updateRequestStatus, updateSettings,
} = require('../controllers/adminController')

const router = express.Router()
router.use(requireAuth, requireSuperadmin)
router.get('/analytics', getAnalytics)
router.get('/requests', listRequests)
router.patch('/requests/:id/status', updateRequestStatus)
router.get('/settings', getAdminSettings)
router.put('/settings', updateSettings)

module.exports = router