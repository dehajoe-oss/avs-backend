// backend/src/middlewares/rateLimiters.js
// Limiteurs ciblés (en plus du global 500/15min de app.js).
const rateLimit = require('express-rate-limit')

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // login / inscription : anti brute-force
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
  },
})

const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // mot de passe oublié / reset / changement : anti-spam
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Trop de demandes. Réessayez dans 15 minutes.',
  },
})

module.exports = { authLimiter, sensitiveLimiter }
