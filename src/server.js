// backend/src/server.js
const app = require('./app')
const { PORT, NODE_ENV } = require('./config/env')
const prisma = require('./lib/prisma')

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('════════════════════════════════════════════════════════')
  console.log(`🚀 SERVEUR BACKEND AVS CONGO EN LIGNE`)
  console.log(`📡 URL locale   : http://localhost:${PORT}`)
  console.log(`🌍 Environnement: ${NODE_ENV}`)
  console.log(`🩺 Health Check : http://localhost:${PORT}/api/health`)
  console.log('════════════════════════════════════════════════════════')
})

// Arrêt propre (Graceful Shutdown) compatible Render
async function gracefulShutdown(signal) {
  console.log(`\n🛑 Signal ${signal} reçu. Fermeture du serveur en cours...`)
  server.close(async () => {
    console.log('🔌 Serveur HTTP fermé.')
    try {
      await prisma.$disconnect()
      console.log('📦 Connexion Prisma PostgreSQL fermée proprement.')
      process.exit(0)
    } catch (err) {
      console.error('❌ Erreur lors de la déconnexion de Prisma :', err)
      process.exit(1)
    }
  })

  // Forcer l'arrêt après 10s si des connexions traînent
  setTimeout(() => {
    console.error('⚠️ Arrêt forcé après timeout de 10s.')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))
