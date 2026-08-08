const express = require("express")
const cors = require("cors")

const authRoutes = require("./routes/authRoutes")
const conversationRoutes = require("./routes/conversationRoutes")
const messageRoutes = require("./routes/messageRoutes")
const pushRoutes = require("./routes/pushRoutes")

const app = express()

const corsOptions = {
  origin: "https://chatting-kuy-fawn.vercel.app",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204
}

// CORS
app.use(cors(corsOptions))

// Explicit preflight
app.options("*", cors(corsOptions))

// Body parser
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({
  extended: true,
  limit: "10mb"
}))

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Chatting Kuy Backend is running"
  })
})

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/conversations", conversationRoutes)
app.use("/api/messages", messageRoutes)
app.use("/api/push", pushRoutes)

module.exports = app