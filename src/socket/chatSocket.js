const prisma = require("../config/prisma")
const onlineUsers = require("../utils/onlineUsers")

module.exports = (io) => {

   io.on("connection", (socket) => {

      socket.on("join", (userId) => {
         onlineUsers.set(String(userId), socket.id)
         socket.userId = userId
         console.log(`User ${userId} connected (${socket.id})`)
      })

      socket.on("join_room", (conversationId) => {
         socket.join(String(conversationId))
      })

      socket.on("send_message", async (data) => {
         try {
            const message = await prisma.message.create({
               data: {
                  content: data.content,
                  senderId: Number(data.senderId),
                  conversationId: Number(data.conversationId),
                  isRead: false,
               },
               include: {
                  sender: { select: { id: true, username: true, avatar: true } }
               }
            })
            io.to(String(data.conversationId)).emit("receive_message", message)
         } catch (err) {
            console.error("send_message error:", err)
            socket.emit("message_error", { message: "Gagal mengirim pesan" })
         }
      })

      // Saat user membuka conversation → mark semua pesan sebagai dibaca
      // dan broadcast ke pengirim agar ceklis berubah jadi biru
      socket.on("mark_read", async ({ conversationId, userId }) => {
         try {
            // Update DB — semua pesan bukan milik userId yang belum dibaca
            await prisma.message.updateMany({
               where: {
                  conversationId: Number(conversationId),
                  senderId: { not: Number(userId) },
                  isRead: false,
               },
               data: { isRead: true }
            })

            // Broadcast ke semua di room — termasuk pengirim asli
            // agar ceklis abu berubah jadi biru di layar mereka
            io.to(String(conversationId)).emit("messages_read", {
               conversationId: Number(conversationId),
               readBy: Number(userId),
            })
         } catch (err) {
            console.error("mark_read error:", err)
         }
      })

      socket.on("typing", (data) => {
         socket.to(String(data.room)).emit("typing", {
            userId: data.userId,
            room: data.room,
         })
      })

      socket.on("stop_typing", (data) => {
         socket.to(String(data.room)).emit("stop_typing", {
            userId: data.userId,
            room: data.room,
         })
      })

      socket.on("disconnect", () => {
         for (const [key, value] of onlineUsers.entries()) {
            if (value === socket.id) {
               onlineUsers.delete(key)
               console.log(`User ${key} disconnected`)
               break
            }
         }
      })

   })

}