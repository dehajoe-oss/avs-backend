// backend/src/app.js
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')

const errorHandler = require('./middlewares/errorHandler')
const { FRONTEND_URL, NODE_ENV } = require('./config/env')

// Importation des routes
const healthRoutes = require('./routes/healthRoutes')
const authRoutes = require('./routes/authRoutes')
const productRoutes = require('./routes/productRoutes')
const orderRoutes = require('./routes/orderRoutes')
const paymentRoutes = require('./routes/paymentRoutes')
const contactRoutes = require('./routes/contactRoutes')
const uploadRoutes = require('./routes/uploadRoutes')
const leadRoutes = require('./routes/leadRoutes')
const appointmentRoutes = require('./routes/appointmentRoutes')
const formationRoutes = require('./routes/formationRoutes')
const testimonialRoutes = require('./routes/testimonialRoutes')
const userRoutes = require('./routes/userRoutes')
const invoiceRoutes = require('./routes/invoiceRoutes')
const conversationRoutes = require('./routes/conversationRoutes')
const statsRoutes = require('./routes/statsRoutes')

const app = express()

// 1. Sécurité HTTP avec Helmet
app.use(helmet())

// 2. CORS souple (autorise le frontend Next.js en local, Vercel et le domaine final)
const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3003',
  'https://agrovetoservices.cg',
  'https://www.agrovetoservices.cg',
].filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      // Autoriser les requêtes sans origine (comme Postman, mobile apps, ou curl)
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        return callback(null, true)
      }
      callback(null, true) // Permissif pour faciliter l'intégration frontend
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

// 3. Logger HTTP
if (NODE_ENV !== 'test') {
  app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'))
}

// 4. Limiteur de requêtes global anti-DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requêtes par fenêtre par IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Trop de requêtes envoyées depuis cette adresse IP, veuillez patienter.',
  },
})
app.use('/api/', limiter)

// 5. Parsers de corps de requête
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 6. Enregistrement des routes API
app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/uploads', uploadRoutes)
app.use('/api/leads', leadRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/formations', formationRoutes)
app.use('/api/testimonials', testimonialRoutes)
app.use('/api/users', userRoutes)
app.use('/api/invoices', invoiceRoutes)
app.use('/api/conversations', conversationRoutes)
app.use('/api/stats', statsRoutes)

// Page d'accueil racine de l'API
app.get('/', (req, res) => {
  res.json({
    service: 'Agro Véto Services Congo — Backend API',
    version: '1.0.0',
    documentation: '/api/health',
    status: 'en ligne 🚀',
  })
})

// 7. Route 404 pour les endpoints inconnus
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route introuvable : ${req.method} ${req.originalUrl}`,
  })
})

// 8. Gestionnaire d'erreurs global
app.use(errorHandler)

module.exports = app
