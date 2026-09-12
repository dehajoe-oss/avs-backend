// backend/src/routes/statsRoutes.js
const express = require('express')
const router = express.Router()
const statsController = require('../controllers/statsController')
const { authenticate, requireStaffOrAdmin } = require('../middlewares/auth')

// Tracking visiteur (public)
router.post('/track', statsController.trackPageView)

// Statistiques administratives
router.get('/dashboard', authenticate, requireStaffOrAdmin, statsController.getDashboardStats)

module.exports = router
