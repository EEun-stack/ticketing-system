const express = require('express')
const { requireAuth, requireSuperadmin } = require('../middleware/auth')
const {
  createAdminUser,
  deleteAdminUser,
  getAdminSettings,
  getAnalytics,
  listAdminUsers,
  listRequests,
  updateRequestStatus,
  updateSettings,
} = require('../controllers/adminController')

const router = express.Router()
router.use(requireAuth)
router.get('/analytics', getAnalytics)
router.get('/requests', listRequests)
router.patch('/requests/:id/status', updateRequestStatus)
router.get('/settings', requireSuperadmin, getAdminSettings)
router.put('/settings', requireSuperadmin, updateSettings)
router.get('/users', requireSuperadmin, listAdminUsers)
router.post('/users', requireSuperadmin, createAdminUser)
router.delete('/users/:id', requireSuperadmin, deleteAdminUser)

module.exports = router
