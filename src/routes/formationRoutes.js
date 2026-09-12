// backend/src/routes/formationRoutes.js
const express = require('express')
const router = express.Router()
const formationController = require('../controllers/formationController')
const { authenticate, requireStaffOrAdmin } = require('../middlewares/auth')

// ── Inscriptions (Placées AVANT /:idOrSlug pour éviter le conflit d'URL) ──
router.get('/registrations', authenticate, requireStaffOrAdmin, formationController.getAllRegistrations)
router.patch('/registrations/:id/status', authenticate, requireStaffOrAdmin, formationController.updateRegistrationStatus)
router.post('/register', formationController.registerFormation)

// ── Catalogue Public & CRUD Admin ──
router.get('/', formationController.getAllFormations)
router.post('/', formationController.registerFormation) // Fallback rétro-compatible pour soumission directe
router.post('/create', authenticate, requireStaffOrAdmin, formationController.createFormation)
router.get('/:idOrSlug', formationController.getFormationBySlug)
router.put('/:id', authenticate, requireStaffOrAdmin, formationController.updateFormation)
router.delete('/:id', authenticate, requireStaffOrAdmin, formationController.deleteFormation)

module.exports = router
