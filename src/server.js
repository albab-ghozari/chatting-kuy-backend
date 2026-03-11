require("dotenv").config()

const http = require("http")
const { Server } = require("socket.io")

const app = require("./app")
const chatSocket = require("./socket/chatSocket")

const server = http.createServer(app)

const io = new Server(server, {
  cors: { origin: "*" }
})

// Simpan io ke app agar bisa diakses dari controller (authController dll)
app.set('io', io)

chatSocket(io)

const PORT = process.env.PORT || 3000

server.listen(PORT, () => {
  console.log("Server running on", PORT)
})