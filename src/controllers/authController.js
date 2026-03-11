const prisma = require("../config/prisma")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

exports.register = async (req, res) => {
   const { username, password } = req.body
   if (!username?.trim() || !password)
      return res.status(400).json({ message: "Username dan password wajib diisi" })

   const existing = await prisma.user.findUnique({ where: { username } })
   if (existing)
      return res.status(409).json({ message: "Username sudah digunakan" })

   const hash = await bcrypt.hash(password, 10)
   const user = await prisma.user.create({
      data: { username, password: hash }
   })

   const io = req.app.get('io')
   if (io) io.emit('new_user', { id: user.id, username: user.username })

   res.status(201).json({ id: user.id, username: user.username, createdAt: user.createdAt })
}

exports.login = async (req, res) => {
   const { username, password } = req.body
   if (!username?.trim() || !password)
      return res.status(400).json({ message: "Username dan password wajib diisi" })

   const user = await prisma.user.findUnique({ where: { username } })
   if (!user) return res.status(404).json({ message: "User tidak ada" })

   const valid = await bcrypt.compare(password, user.password)
   if (!valid) return res.status(401).json({ message: "Password salah" })

   const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" })

   res.json({
      token,
      user: { id: user.id, username: user.username, avatar: user.avatar, createdAt: user.createdAt }
   })
}

// GET /api/auth/me
exports.getMe = async (req, res) => {
   const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, username: true, avatar: true, createdAt: true }
   })
   if (!user) return res.status(404).json({ message: "User tidak ditemukan" })
   res.json(user)
}

// PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
   const userId = req.user.id
   const { username, avatar, currentPassword, newPassword } = req.body

   const user = await prisma.user.findUnique({ where: { id: userId } })
   if (!user) return res.status(404).json({ message: "User tidak ditemukan" })

   const updateData = {}

   // Update username
   if (username && username.trim() !== user.username) {
      const taken = await prisma.user.findUnique({ where: { username: username.trim() } })
      if (taken) return res.status(409).json({ message: "Username sudah digunakan" })
      updateData.username = username.trim()
   }

   // Update avatar (base64)
   if (avatar !== undefined) {
      // Validasi ukuran max ~2MB (base64 ~2.7MB string)
      if (avatar && avatar.length > 3_000_000)
         return res.status(400).json({ message: "Ukuran foto terlalu besar (max 2MB)" })
      updateData.avatar = avatar
   }

   // Update password
   if (newPassword) {
      if (!currentPassword)
         return res.status(400).json({ message: "Masukkan password lama" })
      const valid = await bcrypt.compare(currentPassword, user.password)
      if (!valid) return res.status(401).json({ message: "Password lama salah" })
      updateData.password = await bcrypt.hash(newPassword, 10)
   }

   if (Object.keys(updateData).length === 0)
      return res.status(400).json({ message: "Tidak ada perubahan" })

   const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, username: true, avatar: true, createdAt: true }
   })

   // Broadcast ke semua user — avatar/username berubah
   const io = req.app.get('io')
   if (io) io.emit('user_updated', updated)

   res.json(updated)
}