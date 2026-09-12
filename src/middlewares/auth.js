// backend/src/middlewares/auth.js
const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('../config/env')
const prisma = require('../lib/prisma')

/**
 * Middleware vérifiant la présence et la validité du token JWT Bearer
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Accès non autorisé : Token JWT manquant',
      })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        avatar: true,
        isActive: true,
      },
    })

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur introuvable ou compte désactivé',
      })
    }

    req.user = user
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expirée, veuillez vous reconnecter' })
    }
    return res.status(401).json({ success: false, message: 'Token d’authentification invalide' })
  }
}

/**
 * Middleware vérifiant si l'utilisateur possède le rôle ADMIN
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Accès interdit : Droits administrateur requis',
    })
  }
  next()
}

/**
 * Middleware autorisant ADMIN et STAFF
 */
function requireStaffOrAdmin(req, res, next) {
  if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'STAFF')) {
    return res.status(403).json({
      success: false,
      message: 'Accès interdit : Réservé à l’équipe AVS',
    })
  }
  next()
}

module.exports = {
  authenticate,
  requireAdmin,
  requireStaffOrAdmin,
}
