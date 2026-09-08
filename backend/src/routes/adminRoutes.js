const express = require('express')
const { requireAuth, requireSuperadmin } = require('../middleware/auth')
const {
  createAdminUser,
  claimRequest,
  deleteAdminUser,
  downloadDatabaseBackup,
  getAccountSettings,
  getAdminSettings,
  getAnalytics,
  getSystemInfo,
  listActivityLogs,
  listAdminUsers,
  listRequests,
  updateRequestStatus,
  updateAccountSettings,
  updateAdminUser,
  updateSettings,
} = require('../controllers/adminController')

const router = express.Router()
router.use(requireAuth)
router.get('/analytics', getAnalytics)
router.get('/activity-logs', requireSuperadmin, listActivityLogs)
router.get('/system-info', requireSuperadmin, getSystemInfo)
router.get('/account', getAccountSettings)
router.put('/account', updateAccountSettings)
router.get('/database-backup', requireSuperadmin, downloadDatabaseBackup)
router.get('/requests', listRequests)
router.patch('/requests/:id/claim', claimRequest)
router.patch('/requests/:id/status', updateRequestStatus)
router.get('/settings', requireSuperadmin, getAdminSettings)
router.put('/settings', requireSuperadmin, updateSettings)
router.get('/users', requireSuperadmin, listAdminUsers)
router.get('/users/:id', requireSuperadmin, (request, response) => {
  response.status(405).json({ message: 'Use the update endpoint to save admin user changes.' })
})
router.post('/users', requireSuperadmin, createAdminUser)
router.put('/users/:id', requireSuperadmin, updateAdminUser)
router.delete('/users/:id', requireSuperadmin, deleteAdminUser)

module.exports = router
