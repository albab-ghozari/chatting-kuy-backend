const prisma = require('../config/prisma')
const webpush = require('web-push')

webpush.setVapidDetails(
   'mailto:admin@chattingkuy.app',
   process.env.VAPID_PUBLIC_KEY,
   process.env.VAPID_PRIVATE_KEY
)

// POST /api/push/subscribe
exports.subscribe = async (req, res) => {
   const userId = req.user.id
   const { endpoint, keys } = req.body

   if (!endpoint || !keys?.p256dh || !keys?.auth)
      return res.status(400).json({ message: 'Data subscription tidak lengkap' })

   try {
      await prisma.pushSubscription.upsert({
         where: { endpoint },
         update: { p256dh: keys.p256dh, auth: keys.auth, userId },
         create: { userId, endpoint, p256dh: keys.p256dh, auth: keys.auth }
      })
      res.json({ ok: true })
   } catch (e) {
      res.status(500).json({ message: e.message })
   }
}

// POST /api/push/unsubscribe
exports.unsubscribe = async (req, res) => {
   const { endpoint } = req.body
   try {
      await prisma.pushSubscription.deleteMany({ where: { endpoint } })
      res.json({ ok: true })
   } catch (e) {
      res.status(500).json({ message: e.message })
   }
}

// Utility — kirim push ke semua subscription milik userId
exports.sendPushToUser = async (userId, payload) => {
   const subs = await prisma.pushSubscription.findMany({ where: { userId } })

   for (const sub of subs) {
      try {
         await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify(payload)
         )
      } catch (e) {
         // Subscription expired/invalid — hapus dari DB
         if (e.statusCode === 404 || e.statusCode === 410) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => { })
         }
      }
   }
}