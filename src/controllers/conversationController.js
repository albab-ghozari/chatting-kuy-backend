const prisma = require("../config/prisma")

// GET /api/conversations
exports.getConversations = async (req, res) => {
  const userId = req.user.id

  const conversations = await prisma.conversation.findMany({
    where: {
      participants: { some: { userId } }
    },
    include: {
      participants: {
        include: {
          user: { select: { id: true, username: true, avatar: true } }
        }
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    },
    orderBy: { createdAt: "desc" }
  })

  const result = await Promise.all(conversations.map(async (conv) => {
    const other = conv.participants.find((p) => p.userId !== userId)?.user
    const lastMessage = conv.messages[0] ?? null

    const unreadCount = await prisma.message.count({
      where: {
        conversationId: conv.id,
        senderId: { not: userId },
        isRead: false
      }
    })

    return {
      id: conv.id,
      name: other?.username ?? "Unknown",
      otherUserId: other?.id,
      otherAvatar: other?.avatar ?? null,   // ← kirim avatar lawan bicara
      lastMessage: lastMessage?.content ?? null,
      lastMessageAt: lastMessage?.createdAt ?? conv.createdAt,
      createdAt: conv.createdAt,
      unread: unreadCount
    }
  }))

  res.json(result)
}

// POST /api/conversations
exports.createConversation = async (req, res) => {
  const userId = req.user.id
  const { targetUserId } = req.body

  if (!targetUserId)
    return res.status(400).json({ message: "targetUserId diperlukan" })

  if (Number(targetUserId) === userId)
    return res.status(400).json({ message: "Tidak bisa chat dengan diri sendiri" })

  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId } } },
        { participants: { some: { userId: Number(targetUserId) } } }
      ]
    }
  })

  if (existing) return res.json(existing)

  const conversation = await prisma.conversation.create({
    data: {
      participants: {
        create: [
          { userId },
          { userId: Number(targetUserId) }
        ]
      }
    },
    include: { participants: { include: { user: true } } }
  })

  res.status(201).json(conversation)
}

// GET /api/conversations/users?q=keyword
exports.searchUsers = async (req, res) => {
  const userId = req.user.id
  const { q } = req.query

  const users = await prisma.user.findMany({
    where: {
      AND: [
        { id: { not: userId } },
        q ? { username: { contains: q, mode: "insensitive" } } : {}
      ]
    },
    select: { id: true, username: true },
    take: 10
  })

  res.json(users)
}