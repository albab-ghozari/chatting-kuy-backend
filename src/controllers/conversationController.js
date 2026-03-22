const prisma = require("../config/prisma")

// GET /api/conversations
exports.getConversations = async (req, res) => {
  try {
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
      const lastMessage = conv.messages[0] ?? null
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conv.id,
          senderId: { not: userId },
          isRead: false
        }
      })

      if (conv.isGroup) {
        // Grup: gunakan groupName & groupAvatar, sertakan daftar members
        const members = conv.participants.map((p) => ({
          id: p.user.id,
          username: p.user.username,
          avatar: p.user.avatar ?? null,
          role: p.role
        }))
        return {
          id: conv.id,
          isGroup: true,
          name: conv.groupName ?? "Grup",
          groupAvatar: conv.groupAvatar ?? null,
          members,
          lastMessage: lastMessage?.content ?? null,
          lastMessageAt: lastMessage?.createdAt ?? conv.createdAt,
          createdAt: conv.createdAt,
          unread: unreadCount
        }
      } else {
        // DM biasa
        const other = conv.participants.find((p) => p.userId !== userId)?.user
        return {
          id: conv.id,
          isGroup: false,
          name: other?.username ?? "Unknown",
          otherUserId: other?.id,
          otherAvatar: other?.avatar ?? null,
          lastMessage: lastMessage?.content ?? null,
          lastMessageAt: lastMessage?.createdAt ?? conv.createdAt,
          createdAt: conv.createdAt,
          unread: unreadCount
        }
      }
    }))

    res.json(result)
  } catch (e) {
    console.error('getConversations error:', e)
    res.status(500).json({ message: e.message })
  }
}

// POST /api/conversations — buat DM
exports.createConversation = async (req, res) => {
  const userId = req.user.id
  const { targetUserId } = req.body

  if (!targetUserId)
    return res.status(400).json({ message: "targetUserId diperlukan" })
  if (Number(targetUserId) === userId)
    return res.status(400).json({ message: "Tidak bisa chat dengan diri sendiri" })

  const existing = await prisma.conversation.findFirst({
    where: {
      isGroup: false,
      AND: [
        { participants: { some: { userId: Number(userId) } } },
        { participants: { some: { userId: Number(targetUserId) } } }
      ]
    },
    include: { participants: { include: { user: true } } }
  })

  if (existing) {
    const other = existing.participants.find((p) => p.userId !== userId)?.user
    return res.json({
      id: existing.id,
      isGroup: false,
      name: other?.username ?? "Unknown",
      otherUserId: other?.id,
      otherAvatar: other?.avatar ?? null,
      lastMessage: null,
      lastMessageAt: existing.createdAt,
      createdAt: existing.createdAt,
      unread: 0
    })
  }

  const conversation = await prisma.conversation.create({
    data: {
      isGroup: false,
      participants: {
        create: [
          { userId: Number(userId), role: "member" },
          { userId: Number(targetUserId), role: "member" }
        ]
      }
    },
    include: { participants: { include: { user: true } } }
  })

  const other = conversation.participants.find((p) => p.userId !== userId)?.user
  res.status(201).json({
    id: conversation.id,
    isGroup: false,
    name: other?.username ?? "Unknown",
    otherUserId: other?.id,
    otherAvatar: other?.avatar ?? null,
    lastMessage: null,
    lastMessageAt: conversation.createdAt,
    createdAt: conversation.createdAt,
    unread: 0
  })
}

// POST /api/conversations/group — buat grup baru
exports.createGroup = async (req, res) => {
  try {
    const userId = req.user.id
    const { groupName, memberIds } = req.body

    if (!groupName?.trim())
      return res.status(400).json({ message: "groupName diperlukan" })
    if (!Array.isArray(memberIds) || memberIds.length < 1)
      return res.status(400).json({ message: "Minimal 1 anggota selain kamu" })

    const allMemberIds = [...new Set([userId, ...memberIds.map(Number)])]

    const conversation = await prisma.conversation.create({
      data: {
        isGroup: true,
        groupName: groupName.trim(),
        participants: {
          create: allMemberIds.map((id) => ({
            userId: id,
            role: id === userId ? "admin" : "member"
          }))
        }
      },
      include: {
        participants: {
          include: { user: { select: { id: true, username: true, avatar: true } } }
        }
      }
    })

    const members = conversation.participants.map((p) => ({
      id: p.user.id,
      username: p.user.username,
      avatar: p.user.avatar ?? null,
      role: p.role
    }))

    res.status(201).json({
      id: conversation.id,
      isGroup: true,
      name: conversation.groupName,
      groupAvatar: null,
      members,
      lastMessage: null,
      lastMessageAt: conversation.createdAt,
      createdAt: conversation.createdAt,
      unread: 0
    })
  } catch (e) {
    console.error('createGroup error:', e)
    res.status(500).json({ message: e.message })
  }
}

// POST /api/conversations/:id/members — tambah anggota ke grup
exports.addMember = async (req, res) => {
  try {
    const userId = req.user.id
    const convId = Number(req.params.id)
    const { targetUserId } = req.body

    // Cek hanya admin yang bisa tambah
    const myParticipant = await prisma.participant.findUnique({
      where: { userId_conversationId: { userId, conversationId: convId } }
    })
    if (!myParticipant || myParticipant.role !== "admin")
      return res.status(403).json({ message: "Hanya admin yang bisa menambah anggota" })

    await prisma.participant.upsert({
      where: { userId_conversationId: { userId: Number(targetUserId), conversationId: convId } },
      update: {},
      create: { userId: Number(targetUserId), conversationId: convId, role: "member" }
    })

    const user = await prisma.user.findUnique({
      where: { id: Number(targetUserId) },
      select: { id: true, username: true, avatar: true }
    })

    res.json({ message: "Anggota ditambahkan", user })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
}

// DELETE /api/conversations/:id/members/:userId — keluarkan anggota
exports.removeMember = async (req, res) => {
  try {
    const requesterId = req.user.id
    const convId = Number(req.params.id)
    const targetId = Number(req.params.userId)

    const myParticipant = await prisma.participant.findUnique({
      where: { userId_conversationId: { userId: requesterId, conversationId: convId } }
    })

    // Admin bisa keluarkan siapa saja, member hanya bisa keluar sendiri
    if (!myParticipant) return res.status(403).json({ message: "Tidak dalam grup ini" })
    if (myParticipant.role !== "admin" && targetId !== requesterId)
      return res.status(403).json({ message: "Hanya admin yang bisa mengeluarkan anggota lain" })

    await prisma.participant.delete({
      where: { userId_conversationId: { userId: targetId, conversationId: convId } }
    })

    res.json({ message: "Anggota dikeluarkan" })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
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
    select: { id: true, username: true, avatar: true },
    take: 20
  })

  res.json(users)
}
