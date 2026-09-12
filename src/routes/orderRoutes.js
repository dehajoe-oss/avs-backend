// backend/src/routes/orderRoutes.js
const express = require('express')
const router = express.Router()
const orderController = require('../controllers/orderController')
const { authenticate, requireStaffOrAdmin } = require('../middlewares/auth')

// Créer une commande (public ou connecté)
router.post('/', (req, res, next) => {
  // Détecte optionnellement le token s'il existe sans bloquer les non-connectés
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticate(req, res, () => orderController.createOrder(req, res, next))
  }
  return orderController.createOrder(req, res, next)
})

// Mes commandes (client connecté)
router.get('/my-orders', authenticate, orderController.getMyOrders)

// Suivi public par numéro de commande
router.get('/track/:orderNumber', orderController.getOrderByNumber)

// Admin : liste et mise à jour
router.get('/', authenticate, requireStaffOrAdmin, orderController.getAllOrders)
router.patch('/:id/status', authenticate, requireStaffOrAdmin, orderController.updateOrderStatus)

module.exports = router
