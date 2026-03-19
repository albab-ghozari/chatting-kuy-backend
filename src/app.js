const express = require("express")
const cors = require("cors")

const authRoutes = require("./routes/authRoutes")
const conversationRoutes = require("./routes/conversationRoutes")
const messageRoutes = require("./routes/messageRoutes")
const pushRoutes = require("./routes/pushRoutes")

const app = express()

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://chatting-kuy-fawn.vercel.app',
    /\.vercel\.app$/
  ],
  credentials: true
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use("/api/auth", authRoutes)
app.use("/api/conversations", conversationRoutes)
app.use("/api/messages", messageRoutes)
app.use("/api/push", pushRoutes)

module.exports = app