// backend/src/controllers/userController.js
const prisma = require('../lib/prisma')
const bcrypt = require('bcryptjs')
const { checkPassword, normalizePhone } = require('../lib/accountPolicy')

/**
 * Liste paginée et filtrable de tous les utilisateurs (Admin / Staff)
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role, status, userType, search, page = 1, limit = 50 } = req.query
    const where = {}

    if (role && role !== 'ALL') {
      where.role = role
    }

    if (status !== undefined && status !== 'ALL') {
      where.isActive = status === 'active' || status === 'true'
    }

    if (userType && userType !== 'ALL') {
      where.userType = userType
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
      ]
    }

    const skip = (Number(page) - 1) * Number(limit)
    const take = Number(limit)

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          userType: true,
          companyName: true,
          address: true,
          city: true,
          avatar: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              orders: true,
              appointments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ])

    // Résumé global des profils
    const counts = await prisma.user.groupBy({
      by: ['role'],
      _count: { id: true },
    })

    const roleCounts = {
      ADMIN: 0,
      STAFF: 0,
      CLIENT: 0,
    }
    counts.forEach((c) => {
      roleCounts[c.role] = c._count.id
    })

    res.json({
      success: true,
      total,
      page: Number(page),
      limit: Number(limit),
      roleCounts,
      data: users,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Détails d'un utilisateur avec son historique complet
 */
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        userType: true,
        companyName: true,
        address: true,
        city: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        appointments: {
          orderBy: { appointmentDate: 'desc' },
          take: 10,
        },
      },
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable.',
      })
    }

    res.json({ success: true, data: user })
  } catch (error) {
    next(error)
  }
}

/**
 * Créer un compte utilisateur manuellement (Admin)
 */
exports.createUser = async (req, res, next) => {
  try {
    const { email, password, name, phone, role, userType, companyName, address, city } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, mot de passe et nom complet sont obligatoires.',
      })
    }

    const passwordError = checkPassword(password)
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError })
    }

    if (phone && String(phone).trim() && !normalizePhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Numéro de téléphone invalide (8 à 15 chiffres attendus).',
      })
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    })

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cette adresse email existe déjà.',
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        name: name.trim(),
        phone: phone ? normalizePhone(phone) : null,
        role: role || 'CLIENT',
        userType: userType || 'individual',
        companyName: companyName ? companyName.trim() : null,
        address: address ? address.trim() : null,
        city: city || 'Pointe-Noire',
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        userType: true,
        companyName: true,
        address: true,
        city: true,
        isActive: true,
        createdAt: true,
      },
    })

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès.',
      data: user,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Mettre à jour un utilisateur (Admin)
 */
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, phone, email, role, userType, companyName, address, city, isActive, password } = req.body

    // Anti auto-dégradation : on ne quitte pas son propre rôle Direction par API.
    if (req.user && req.user.id === id && role && role !== 'ADMIN' && req.user.role === 'ADMIN') {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas retirer votre propre rôle Direction.',
      })
    }

    const updateData = {}
    if (name) updateData.name = name.trim()
    if (phone !== undefined) {
      if (phone && String(phone).trim() && !normalizePhone(phone)) {
        return res.status(400).json({
          success: false,
          message: 'Numéro de téléphone invalide (8 à 15 chiffres attendus).',
        })
      }
      updateData.phone = phone ? normalizePhone(phone) : null
    }
    if (email) updateData.email = email.trim().toLowerCase()
    if (role) updateData.role = role
    if (userType) updateData.userType = userType
    if (companyName !== undefined) updateData.companyName = companyName ? companyName.trim() : null
    if (address !== undefined) updateData.address = address ? address.trim() : null
    if (city) updateData.city = city
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)

    if (password) {
      const passwordError = checkPassword(password)
      if (passwordError) {
        return res.status(400).json({ success: false, message: passwordError })
      }
      updateData.password = await bcrypt.hash(password.trim(), 10)
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        userType: true,
        companyName: true,
        address: true,
        city: true,
        isActive: true,
        updatedAt: true,
      },
    })

    res.json({
      success: true,
      message: 'Compte utilisateur mis à jour avec succès.',
      data: user,
    })
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, message: 'Cette adresse email est déjà utilisée.' })
    }
    next(error)
  }
}

/**
 * Basculer l'état actif/bloqué d'un utilisateur (Admin)
 */
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params

    if (req.user.id === id) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas désactiver votre propre compte administrateur.',
      })
    }

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable.' })
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
      },
    })

    res.json({
      success: true,
      message: updated.isActive ? 'Compte utilisateur réactivé.' : 'Compte utilisateur suspendu.',
      data: updated,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Supprimer un compte utilisateur (Admin)
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params

    if (req.user.id === id) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer votre propre compte administrateur.',
      })
    }

    await prisma.user.delete({
      where: { id },
    })

    res.json({
      success: true,
      message: 'Utilisateur supprimé définitivement.',
    })
  } catch (error) {
    next(error)
  }
}
