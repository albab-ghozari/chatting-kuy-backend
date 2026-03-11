const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

prisma.$connect()
  .then(() => console.log('✅ Database Supabase terhubung!'))
  .catch((e) => console.error('❌ Database gagal:', e.message))

process.on('beforeExit', () => {
  prisma.$disconnect()
})

module.exports = prisma