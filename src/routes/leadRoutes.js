// backend/src/routes/leadRoutes.js
const express = require('express')
const router = express.Router()
const leadController = require('../controllers/leadController')
const { authenticate, requireStaffOrAdmin } = require('../middlewares/auth')

// Formulaire public de contact / devis
router.post('/', leadController.createLead)

// Gestion admin
router.get('/', authenticate, requireStaffOrAdmin, leadController.getAllLeads)
router.patch('/:id/status', authenticate, requireStaffOrAdmin, leadController.updateLeadStatus)
router.delete('/:id', authenticate, requireStaffOrAdmin, leadController.deleteLead)

module.exports = router
