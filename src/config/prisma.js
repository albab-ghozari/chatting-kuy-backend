const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  log: ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

async function connectWithRetry(retries = 5, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect()
      console.log('✅ Database Supabase terhubung!')
      return
    } catch (e) {
      console.log(`❌ Database gagal: ${e.message}`)
      if (i < retries - 1) {
        console.log(`🔁 Retry ${i + 1}/${retries - 1} dalam ${delay / 1000}s...`)
        await new Promise(res => setTimeout(res, delay))
      }
    }
  }
  console.log('❌ Database tidak bisa terhubung setelah beberapa percobaan')
}

connectWithRetry()

prisma.$on('beforeExit', async () => {
  await prisma.$disconnect()
})

module.exports = prisma