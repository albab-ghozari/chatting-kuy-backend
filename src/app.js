const express = require("express")
const cors = require("cors")

const authRoutes = require("./routes/authRoutes")
const conversationRoutes = require("./routes/conversationRoutes")
const messageRoutes = require("./routes/messageRoutes")
const pushRoutes = require("./routes/pushRoutes")

const app = express()

const allowedOrigins = [
  "https://chatting-kuy-fawn.vercel.app",
  "http://localhost:5173"
]

app.use(cors({
  origin: function (origin, callback) {
    // Izinkan request tanpa Origin
    if (!origin) {
      return callback(null, true)
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    return callback(new Error("Not allowed by CORS"))
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}))

app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({
  extended: true,
  limit: "10mb"
}))

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Chatting Kuy Backend is running"
  })
})

app.use("/api/auth", authRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/conversations", conversationRoutes)
app.use("/api/messages", messageRoutes)
app.use("/api/push", pushRoutes)

module.exports = app