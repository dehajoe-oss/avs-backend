// backend/src/config/env.js
require('dotenv').config()

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || 'avs_jwt_secret_change_me_in_production_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@agrovetoservices.cg',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Admin@Avs2026!',
}
