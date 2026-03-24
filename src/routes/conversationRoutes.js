const express = require("express")
const router = express.Router()
const verifyToken = require("../middleware/verifyToken")
const {
  getConversations,
  createConversation,
  createGroup,
  updateGroup,
  addMember,
  removeMember,
  searchUsers
} = require("../controllers/conversationController")

// Statis di atas, dinamis di bawah
router.get("/users", verifyToken, searchUsers)
router.post("/group", verifyToken, createGroup)

router.get("/", verifyToken, getConversations)
router.post("/", verifyToken, createConversation)

router.put("/:id/group", verifyToken, updateGroup)           // rename & ganti avatar
router.post("/:id/members", verifyToken, addMember)
router.delete("/:id/members/:userId", verifyToken, removeMember)

module.exports = router
