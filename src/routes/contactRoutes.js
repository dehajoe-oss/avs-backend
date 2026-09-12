// backend/src/routes/contactRoutes.js
const express = require('express')
const router = express.Router()
const contactController = require('../controllers/contactController')

// Envoi d'un message depuis le formulaire de contact ou devis
router.post('/', contactController.submitContact)

module.exports = router
