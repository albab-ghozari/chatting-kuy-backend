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

// PENTING: route statis harus SELALU di atas route dinamis (/:id)
// Kalau /:id lebih dulu, Express akan menangkap 'users' dan 'group' sebagai nilai :id
router.get("/users", auth, searchUsers)               // statis — harus paling atas
router.post("/group", auth, createGroup)              // statis — harus di atas /:id

router.get("/", auth, getConversations)
router.post("/", auth, createConversation)

router.post("/:id/members", auth, addMember)          // dinamis — harus paling bawah
router.delete("/:id/members/:userId", auth, removeMember)

module.exports = router
