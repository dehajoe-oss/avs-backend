// backend/src/routes/conversationRoutes.js
const express = require('express')
const router = express.Router()
const conversationController = require('../controllers/conversationController')
const { authenticate, requireStaffOrAdmin } = require('../middlewares/auth')

// Échange public avec l'Assistant IA
router.post('/init', conversationController.getOrCreateConversation)
router.post('/message', conversationController.addMessage)

// Administration : consultation de l'historique
router.get('/', authenticate, requireStaffOrAdmin, conversationController.listConversations)
router.get('/:id', authenticate, requireStaffOrAdmin, conversationController.getConversationById)

module.exports = router
