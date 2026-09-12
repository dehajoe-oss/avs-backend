// backend/src/routes/appointmentRoutes.js
const express = require('express')
const router = express.Router()
const appointmentController = require('../controllers/appointmentController')
const { authenticate, requireStaffOrAdmin } = require('../middlewares/auth')

// Prise de rendez-vous publique
router.post('/', (req, res, next) => {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticate(req, res, () => appointmentController.createAppointment(req, res, next))
  }
  return appointmentController.createAppointment(req, res, next)
})

// Consultation et mise à jour équipe clinique
router.get('/', authenticate, requireStaffOrAdmin, appointmentController.getAllAppointments)
router.patch('/:id/status', authenticate, requireStaffOrAdmin, appointmentController.updateAppointmentStatus)

module.exports = router
