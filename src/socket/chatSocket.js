const prisma = require("../config/prisma")
const onlineUsers = require("../utils/onlineUsers")
const { sendPushToUser } = require("../controllers/pushController")

module.exports = (io) => {
   io.on("connection", (socket) => {

      socket.on("join", (userId) => {
         onlineUsers.set(String(userId), socket.id)
         io.emit('user_online', { userId: Number(userId) })
         const onlineIds = [...onlineUsers.keys()].map(Number)
         socket.emit('online_users', { userIds: onlineIds })
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

         for (const p of participants) {
            if (Number(p.userId) === Number(data.senderId)) continue

            const socketId = onlineUsers.get(String(p.userId))
            const recipientSocket = socketId ? io.sockets.sockets.get(socketId) : null
            const inRoom = recipientSocket?.rooms?.has(String(data.room))

            if (socketId && !inRoom) {
               // User online tapi tidak di room — kirim via socket
               io.to(socketId).emit("receive_message", message)
            }

            if (!socketId) {
               // User offline — kirim push notification
               console.log(`📱 Kirim push ke user ${p.userId}`)
               sendPushToUser(p.userId, {
                  title: message.sender.username,
                  body: message.content,
                  conversationId: data.conversationId
               }).then(() => {
                  console.log(`✅ Push berhasil ke user ${p.userId}`)
               }).catch((e) => {
                  console.log(`❌ Push gagal ke user ${p.userId}:`, e.message)
               })
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