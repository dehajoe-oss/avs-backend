// backend/src/lib/prisma.js
const { PrismaClient } = require('@prisma/client')

const prismaGlobal = globalThis

const prisma =
  prismaGlobal.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  prismaGlobal.prisma = prisma
}

module.exports = prisma
