// backend/src/controllers/authController.js
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../lib/prisma')
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env')

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

exports.register = async (req, res, next) => {
  try {
    const { email, password, name, phone } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Champs obligatoires : email, mot de passe et nom complet',
      })
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Un compte existe déjà avec cette adresse email.',
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        name: name.trim(),
        phone: phone ? phone.trim() : null,
        role: 'CLIENT',
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    })

    const token = generateToken(user.id)

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      data: { user, token },
    })
  } catch (error) {
    next(error)
  }
}

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez renseigner votre email et mot de passe',
      })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides ou compte inactif',
      })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides',
      })
    }

    const token = generateToken(user.id)

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar,
        },
        token,
      },
    })
  } catch (error) {
    next(error)
  }
}

exports.getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        avatar: true,
        createdAt: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        appointments: {
          orderBy: { appointmentDate: 'desc' },
          take: 5,
        },
      },
    })

    res.json({ success: true, data: user })
  } catch (error) {
    next(error)
  }
}

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar } = req.body

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(avatar !== undefined && { avatar }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        avatar: true,
      },
    })

    res.json({ success: true, message: 'Profil mis à jour', data: updated })
  } catch (error) {
    next(error)
  }
}

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez renseigner l’ancien et le nouveau mot de passe',
      })
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } })
    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mot de passe actuel incorrect' })
    }

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashed },
    })

    res.json({ success: true, message: 'Mot de passe modifié avec succès' })
  } catch (error) {
    next(error)
  }
}

exports.listUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: { select: { orders: true, appointments: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ success: true, count: users.length, data: users })
  } catch (error) {
    next(error)
  }
}
