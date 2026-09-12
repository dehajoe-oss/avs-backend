// backend/src/routes/healthRoutes.js
const express = require('express')
const router = express.Router()
const prisma = require('../lib/prisma')

router.get('/', async (req, res) => {
  let dbStatus = 'disconnected'
  try {
    await prisma.$queryRaw`SELECT 1`
    dbStatus = 'connected'
  } catch (error) {
    dbStatus = `error: ${error.message}`
  }

  const isHealthy = dbStatus === 'connected'

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    service: 'Agro Véto Services Congo — Backend API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development',
  })
})

module.exports = router
