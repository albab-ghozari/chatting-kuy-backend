const prisma = require("../config/prisma")
const onlineUsers = require("../utils/onlineUsers")

module.exports = (io) => {
   io.on("connection", (socket) => {

      socket.on("join", (userId) => {
         onlineUsers.set(String(userId), socket.id)
      })

      socket.on("join_room", (conversationId) => {
         socket.join(String(conversationId))
      })

      socket.on("send_message", async (data) => {
         const message = await prisma.message.create({
            data: {
               content: data.content,
               senderId: data.senderId,
               conversationId: data.conversationId
            },
            include: { sender: true }
         })

         // Cari semua participant selain pengirim
         const participants = await prisma.participant.findMany({
            where: { conversationId: Number(data.conversationId) }
         })

         for (const p of participants) {
            if (Number(p.userId) === Number(data.senderId)) continue // skip pengirim

            const socketId = onlineUsers.get(String(p.userId))
            if (!socketId) continue

            const recipientSocket = io.sockets.sockets.get(socketId)
            const inRoom = recipientSocket?.rooms?.has(String(data.room))

            if (inRoom) {
               // Sudah di room — emit via room (sudah dapat dari io.to(room))
            } else {
               // Tidak di room — emit langsung agar notifikasi sampai
               io.to(socketId).emit("receive_message", message)
            }
         }

         // Emit ke room untuk user yang sedang buka conversation
         io.to(String(data.room)).emit("receive_message", message)
      })

      socket.on("typing", (data) => {
         socket.to(String(data.room)).emit("typing", {
            userId: data.userId,
            room: data.room
         })
      })

      socket.on("stop_typing", (data) => {
         socket.to(String(data.room)).emit("stop_typing", {
            userId: data.userId,
            room: data.room
         })
      })

      socket.on("mark_read", async ({ conversationId, userId }) => {
         await prisma.message.updateMany({
            where: {
               conversationId: Number(conversationId),
               senderId: { not: Number(userId) },
               isRead: false
            },
            data: { isRead: true }
         })
         io.to(String(conversationId)).emit("messages_read", {
            conversationId: Number(conversationId),
            readBy: Number(userId)
         })
      })

      socket.on("disconnect", () => {
         for (const [key, value] of onlineUsers.entries()) {
            if (value === socket.id) onlineUsers.delete(key)
         }
      })

   })
}