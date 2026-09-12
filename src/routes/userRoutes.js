// backend/src/routes/userRoutes.js
const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')
const { authenticate, requireStaffOrAdmin, requireAdmin } = require('../middlewares/auth')

// Toutes les routes utilisateurs nécessitent d'être connecté
router.use(authenticate)

// Consultation (Staff et Admin)
router.get('/', requireStaffOrAdmin, userController.getAllUsers)
router.get('/:id', requireStaffOrAdmin, userController.getUserById)

// Actions réservées à l'Administrateur
router.post('/', requireAdmin, userController.createUser)
router.put('/:id', requireAdmin, userController.updateUser)
router.patch('/:id/status', requireAdmin, userController.toggleUserStatus)
router.delete('/:id', requireAdmin, userController.deleteUser)

module.exports = router
