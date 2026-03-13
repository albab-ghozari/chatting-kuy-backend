require("dotenv").config()

const http = require("http")
const { Server } = require("socket.io")

const app = require("./app")
const chatSocket = require("./socket/chatSocket")

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'https://chatting-kuy.vercel.app',
      'https://chatting-kuy-fawn.vercel.app',
      /\.vercel\.app$/
    ],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

app.set('io', io)
chatSocket(io)

const PORT = process.env.PORT || 3000

server.listen(PORT, () => {
  console.log("Server running on", PORT)
})