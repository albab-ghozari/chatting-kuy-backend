const express = require("express")
const verifyToken = require("../middleware/verifyToken")
const {
   getConversations,
   createConversation,
   searchUsers
} = require("../controllers/conversationController")

const router = express.Router()

router.use(verifyToken)

router.get("/", getConversations)
router.post("/", createConversation)
router.get("/users", searchUsers)       // GET /api/conversations/users?q=budi

module.exports = router