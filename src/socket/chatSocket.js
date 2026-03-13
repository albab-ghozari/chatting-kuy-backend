const prisma = require("../config/prisma")
const onlineUsers = require("../utils/onlineUsers")

module.exports = (io) => {
   io.on("connection", (socket) => {

      socket.on("join", (userId) => {
         onlineUsers.set(String(userId), socket.id)
         io.emit('user_online', { userId: Number(userId) })
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

         const participants = await prisma.participant.findMany({
            where: { conversationId: Number(data.conversationId) }
         })

         console.log('📨 send_message convId:', data.conversationId, 'room:', data.room)
         console.log('👥 participants:', participants.map(p => p.userId))
         console.log('🟢 onlineUsers:', [...onlineUsers.entries()])

         for (const p of participants) {
            if (Number(p.userId) === Number(data.senderId)) continue

            const socketId = onlineUsers.get(String(p.userId))
            const recipientSocket = socketId ? io.sockets.sockets.get(socketId) : null
            const inRoom = recipientSocket?.rooms?.has(String(data.room))

            console.log(`👤 user ${p.userId} | socketId: ${socketId} | inRoom: ${inRoom}`)

            if (socketId && !inRoom) {
               io.to(socketId).emit("receive_message", message)
               console.log(`✅ emit langsung ke user ${p.userId}`)
            }
         }

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
            if (value === socket.id) {
               onlineUsers.delete(key)
               io.emit('user_offline', { userId: Number(key) })
            }
         }
      })

   })
}