const express = require("express")
const router = express.Router()
const auth = require("../middleware/auth")
const {
  getConversations,
  createConversation,
  createGroup,
  addMember,
  removeMember,
  searchUsers
} = require("../controllers/conversationController")

router.get("/", auth, getConversations)
router.post("/", auth, createConversation)          // buat DM
router.post("/group", auth, createGroup)             // buat grup
router.post("/:id/members", auth, addMember)         // tambah anggota
router.delete("/:id/members/:userId", auth, removeMember) // keluarkan anggota
router.get("/users", auth, searchUsers)

module.exports = router
