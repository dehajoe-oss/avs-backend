// backend/src/controllers/authController.js
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const prisma = require('../lib/prisma')
const { JWT_SECRET, JWT_EXPIRES_IN, FRONTEND_URL } = require('../config/env')
const { checkPassword, normalizePhone } = require('../lib/accountPolicy')
const { sendMail, resetPasswordMail, hasMailer, isProd } = require('../lib/mailer')

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

exports.register = async (req, res, next) => {
  try {
    const { email, password, name, fullName, phone } = req.body
    const finalName = (name || fullName || '').trim()
    const finalPhone = normalizePhone(phone || '')
    const finalEmail = (email || `${(finalPhone || '').replace(/\D/g, '') || Date.now()}@agrovetoservices.cg`).toLowerCase().trim()

    if (!finalName) {
      return res.status(400).json({
        success: false,
        message: 'Champ obligatoire : nom complet',
      })
    }

    const passwordError = checkPassword(password)
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError })
    }

    if ((phone || '').trim() && !finalPhone) {
      return res.status(400).json({
        success: false,
        message: 'Numéro de téléphone invalide (8 à 15 chiffres attendus).',
      })
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: finalEmail },
          ...(finalPhone ? [{ phone: finalPhone }] : []),
        ],
      },
    })

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Un compte existe déjà avec cet email ou ce numéro de téléphone.',
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email: finalEmail,
        password: hashedPassword,
        name: finalName,
        phone: finalPhone || null,
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
    const { email, phone, identifier, password } = req.body
    const loginId = (identifier || email || phone || '').toLowerCase().trim()
    const loginPhone = normalizePhone(identifier || phone || '') || ''

    if (!loginId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez renseigner votre email ou téléphone et mot de passe',
      })
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: loginId },
          { phone: loginId },
          { phone: loginId.replace(/\s+/g, '') },
          ...(loginPhone ? [{ phone: loginPhone }] : []),
        ],
      },
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

    if (phone !== undefined && phone !== null && String(phone).trim() && !normalizePhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Numéro de téléphone invalide (8 à 15 chiffres attendus).',
      })
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(phone !== undefined && { phone: phone ? normalizePhone(phone) : null }),
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

    const passwordError = checkPassword(newPassword)
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError })
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

// ── Mot de passe oublié : demande de lien (réponse générique anti-énumération)
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email, phone, identifier } = req.body
    const loginId = (identifier || email || phone || '').toLowerCase().trim()
    const loginPhone = normalizePhone(identifier || phone || '') || ''
    const genericMessage = 'Si un compte existe avec ces informations, un lien de réinitialisation vient de lui être envoyé.'

    if (loginId) {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: loginId },
            { phone: loginId },
            ...(loginPhone ? [{ phone: loginPhone }] : []),
          ],
        },
      })

      if (user && user.isActive && user.email && !user.email.endsWith('@agrovetoservices.cg')) {
        const rawToken = crypto.randomBytes(32).toString('hex')
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

        await prisma.user.update({
          where: { id: user.id },
          data: {
            passwordResetToken: tokenHash,
            passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
          },
        })

        const resetUrl = `${FRONTEND_URL.replace(/\/+$/, '')}/mot-de-passe-oublie?token=${rawToken}`
        const mail = resetPasswordMail({ name: user.name, resetUrl })

        if (hasMailer()) {
          try {
            await sendMail({ to: user.email, subject: mail.subject, html: mail.html })
          } catch (mailError) {
            console.error('[Auth] Échec envoi email reset:', mailError.message)
          }
        } else {
          console.info(`[Auth] [DEV] Lien de réinitialisation pour ${user.email} : ${resetUrl}`)
        }

        // En dev (sans mailer configuré), le lien est renvoyé pour test.
        // En production il n'est transmis QUE par email.
        if (!isProd() && !hasMailer()) {
          return res.json({ success: true, message: genericMessage, devResetUrl: resetUrl })
        }
      }
    }

    res.json({ success: true, message: genericMessage })
  } catch (error) {
    next(error)
  }
}

// ── Mot de passe oublié : application du nouveau mot de passe
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password: newPassword } = req.body

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Lien invalide : token et nouveau mot de passe requis.',
      })
    }

    const passwordError = checkPassword(newPassword)
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError })
    }

    const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex')
    const user = await prisma.user.findUnique({ where: { passwordResetToken: tokenHash } })

    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Lien expiré ou invalide. Veuillez refaire une demande.',
      })
    }

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, passwordResetToken: null, passwordResetExpires: null },
    })

    res.json({ success: true, message: 'Mot de passe réinitialisé. Vous pouvez vous connecter.' })
  } catch (error) {
    next(error)
  }
}
