const express = require("express")
const verifyToken = require("../middleware/verifyToken")
const { getMessages, sendMessage } = require("../controllers/messageController")

const router = express.Router()

router.use(verifyToken)

router.get("/:conversationId", getMessages)
router.post("/", sendMessage)   // fallback jika socket tidak dipakai

module.exports = router