// backend/src/routes/invoiceRoutes.js
const express = require('express')
const router = express.Router()
const invoiceController = require('../controllers/invoiceController')
const { authenticate, requireStaffOrAdmin } = require('../middlewares/auth')

// Routes protégées réservées à l'équipe comptabilité / admin
router.post('/', authenticate, requireStaffOrAdmin, invoiceController.createInvoice)
router.get('/', authenticate, requireStaffOrAdmin, invoiceController.getAllInvoices)
router.get('/:id', authenticate, requireStaffOrAdmin, invoiceController.getInvoiceById)
router.patch('/:id/status', authenticate, requireStaffOrAdmin, invoiceController.updateInvoiceStatus)
router.delete('/:id', authenticate, requireStaffOrAdmin, invoiceController.deleteInvoice)

module.exports = router
