const express = require("express")
const router = express.Router()
const verifyToken = require("../middleware/verifyToken") // nama file yang benar
const {
  getConversations,
  createConversation,
  createGroup,
  addMember,
  removeMember,
  searchUsers
} = require("../controllers/conversationController")

// Route statis HARUS di atas route dinamis (/:id)
// agar 'users' dan 'group' tidak tertangkap sebagai nilai :id
router.get("/users", verifyToken, searchUsers)
router.post("/group", verifyToken, createGroup)

router.get("/", verifyToken, getConversations)
router.post("/", verifyToken, createConversation)

router.post("/:id/members", verifyToken, addMember)
router.delete("/:id/members/:userId", verifyToken, removeMember)

module.exports = router
