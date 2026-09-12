// backend/src/routes/authRoutes.js
const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const { authenticate, requireAdmin } = require('../middlewares/auth')

router.post('/register', authController.register)
router.post('/login', authController.login)
router.get('/me', authenticate, authController.getMe)
router.put('/profile', authenticate, authController.updateProfile)
router.put('/password', authenticate, authController.changePassword)
router.get('/users', authenticate, requireAdmin, authController.listUsers)

module.exports = router
