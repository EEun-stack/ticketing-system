const express = require('express')
const { requireAuth, requireSuperadmin } = require('../middleware/auth')
const {
  createAdminUser,
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
router.patch('/requests/:id/status', updateRequestStatus)
router.get('/settings', requireSuperadmin, getAdminSettings)
router.put('/settings', requireSuperadmin, updateSettings)
router.get('/users', requireSuperadmin, listAdminUsers)
router.post('/users', requireSuperadmin, createAdminUser)
router.delete('/users/:id', requireSuperadmin, deleteAdminUser)

module.exports = router
