const prisma = require("../config/prisma")

// GET /api/messages/:conversationId
exports.getMessages = async (req, res) => {
   const { conversationId } = req.params
   const userId = req.user.id

   const participant = await prisma.participant.findFirst({
      where: { conversationId: Number(conversationId), userId }
   })

   if (!participant)
      return res.status(403).json({ message: "Akses ditolak" })

   const messages = await prisma.message.findMany({
      where: { conversationId: Number(conversationId) },
      include: { sender: { select: { id: true, username: true } } },
      orderBy: { createdAt: "asc" }
   })

   res.json(messages)
}

// POST /api/messages
exports.sendMessage = async (req, res) => {
   const userId = req.user.id
   const { conversationId, content } = req.body

   if (!conversationId || !content?.trim())
      return res.status(400).json({ message: "conversationId dan content diperlukan" })

   const participant = await prisma.participant.findFirst({
      where: { conversationId: Number(conversationId), userId }
   })

   if (!participant)
      return res.status(403).json({ message: "Akses ditolak" })

   const message = await prisma.message.create({
      data: {
         content: content.trim(),
         conversationId: Number(conversationId),
         senderId: userId
      },
      include: { sender: { select: { id: true, username: true } } }
   })

   res.status(201).json(message)
}

// POST /api/messages/read/:conversationId
// Dipanggil saat user membuka conversation — mark semua pesan sebagai dibaca
exports.markAsRead = async (req, res) => {
   const { conversationId } = req.params
   const userId = req.user.id

   // Pastikan user adalah peserta conversation ini
   const participant = await prisma.participant.findFirst({
      where: { conversationId: Number(conversationId), userId }
   })

   if (!participant)
      return res.status(403).json({ message: "Akses ditolak" })

   // Update semua pesan di conversation ini yang bukan milik kita dan belum dibaca
   await prisma.message.updateMany({
      where: {
         conversationId: Number(conversationId),
         senderId: { not: userId },   // bukan pesan kita sendiri
         isRead: false                // yang belum dibaca saja
      },
      data: { isRead: true }
   })

   res.json({ ok: true })
}