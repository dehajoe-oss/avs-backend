// backend/src/routes/testimonialRoutes.js
const express = require('express')
const router = express.Router()
const testimonialController = require('../controllers/testimonialController')
const { authenticate, requireStaffOrAdmin } = require('../middlewares/auth')

// ── Consultation publique ──
router.get('/', testimonialController.getAllApproved)

// ── Soumission (publique avec auto-modération, ou admin si authentifié) ──
router.post('/', (req, res, next) => {
  // Optionnellement extrait le user si token présent sans forcer l'auth
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticate(req, res, () => testimonialController.createTestimonial(req, res, next))
  }
  return testimonialController.createTestimonial(req, res, next)
})

// ── Administration (Admin / Staff) ──
router.get('/admin', authenticate, requireStaffOrAdmin, testimonialController.getAllAdmin)
router.put('/:id', authenticate, requireStaffOrAdmin, testimonialController.updateTestimonial)
router.patch('/:id/approve', authenticate, requireStaffOrAdmin, testimonialController.toggleApproval)
router.delete('/:id', authenticate, requireStaffOrAdmin, testimonialController.deleteTestimonial)

module.exports = router
