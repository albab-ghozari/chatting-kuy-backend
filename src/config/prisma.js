const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  log: ["error"],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})


connectWithRetry()

module.exports = prisma