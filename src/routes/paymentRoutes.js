// backend/src/routes/paymentRoutes.js
const express = require('express')
const router = express.Router()
const paymentController = require('../controllers/paymentController')

// Valider une transaction KKiaPay
router.post('/kkiapay/verify', paymentController.verifyKKiaPay)

// Webhook KKiaPay
router.post('/kkiapay/webhook', paymentController.kkiapayWebhook)

// Initier un paiement Mobile Money (MTN MoMo / Airtel Money)
router.post('/momo/initiate', paymentController.initiateMobileMoney)

module.exports = router
