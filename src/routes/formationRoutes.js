// backend/src/routes/formationRoutes.js
const express = require('express')
const router = express.Router()
const formationController = require('../controllers/formationController')
const { authenticate, requireStaffOrAdmin } = require('../middlewares/auth')

// Pré-inscription publique
router.post('/', formationController.registerFormation)

// Gestion administrative
router.get('/', authenticate, requireStaffOrAdmin, formationController.getAllRegistrations)
router.patch('/:id/status', authenticate, requireStaffOrAdmin, formationController.updateRegistrationStatus)

module.exports = router
