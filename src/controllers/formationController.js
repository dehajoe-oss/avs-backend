// backend/src/controllers/formationController.js
const prisma = require('../lib/prisma')

exports.registerFormation = async (req, res, next) => {
  try {
    const { fullName, phone, email, formationType, sessionDate, experience, notes } = req.body

    if (!fullName || !phone || !formationType) {
      return res.status(400).json({
        success: false,
        message: 'Nom complet, numéro WhatsApp et type de formation sont obligatoires.',
      })
    }

    const registration = await prisma.formationRegistration.create({
      data: {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email ? email.trim().toLowerCase() : null,
        formationType: formationType.trim(),
        sessionDate: sessionDate ? new Date(sessionDate) : null,
        experience: experience || 'Débutant',
        notes: notes || null,
      },
    })

    res.status(201).json({
      success: true,
      message: 'Pré-inscription validée ! Notre responsable pédagogique vous contactera sous 48h.',
      data: registration,
    })
  } catch (error) {
    next(error)
  }
}

exports.getAllRegistrations = async (req, res, next) => {
  try {
    const { status, formationType } = req.query
    const where = {}

    if (status) where.status = status
    if (formationType) where.formationType = { contains: formationType, mode: 'insensitive' }

    const registrations = await prisma.formationRegistration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    res.json({ success: true, count: registrations.length, data: registrations })
  } catch (error) {
    next(error)
  }
}

exports.updateRegistrationStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status, notes } = req.body

    const updated = await prisma.formationRegistration.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
    })

    res.json({ success: true, message: 'Statut mis à jour', data: updated })
  } catch (error) {
    next(error)
  }
}
