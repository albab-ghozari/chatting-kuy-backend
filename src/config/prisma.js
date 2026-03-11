const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

prisma.$connect()
   .then(() => console.log('✅ Database Supabase terhubung!'))
   .catch((e) => console.error('❌ Database gagal:', e.message))

// Bersihkan koneksi saat server mati
process.on('beforeExit', async () => {
   await prisma.$disconnect()
})

module.exports = prisma
   ```

Push ke Railways lalu lihat log — kalau muncul:
```
   // ✅ Database Supabase terhubung!
   ```
Berarti sudah konek. Kalau muncul:
```
// ❌ Database gagal: ...