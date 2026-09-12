// backend/src/controllers/leadController.js
const prisma = require('../lib/prisma')

function calculateScore(lead) {
  let score = 20 // Score de base pour soumission
  const text = `${lead.service || ''} ${lead.message || ''} ${lead.budgetRange || ''}`.toLowerCase()

  if (text.match(/(cobb|poussin|500|poulet|pondeuse|volaille)/i)) score += 20
  if (text.match(/(provende|aliment|nutrition|sac|tonne)/i)) score += 20
  if (text.match(/(clinique|urgence|veterinaire|soin|visite|autopsie)/i)) score += 20
  if (text.match(/(qhse|iso|haccp|audit|formation)/i)) score += 15
  if (lead.budgetRange && lead.budgetRange !== 'Non précisé') score += 15
  if (lead.phone && lead.phone.length >= 8) score += 10

  return Math.min(score, 100)
}

exports.createLead = async (req, res, next) => {
  try {
    const { name, email, phone, service, budgetRange, timeline, message } = req.body

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Nom et téléphone / WhatsApp sont obligatoires pour nous contacter.',
      })
    }

    const score = calculateScore({ service, budgetRange, message, phone })

    const lead = await prisma.lead.create({
      data: {
        name: name.trim(),
        email: email ? email.trim().toLowerCase() : null,
        phone: phone.trim(),
        service: service || 'autre',
        budgetRange: budgetRange || null,
        timeline: timeline || null,
        message: message || '',
        score,
        status: score >= 60 ? 'QUALIFIED' : 'NEW',
      },
    })

    res.status(201).json({
      success: true,
      message: 'Votre message a été transmis à l’équipe technique AVS. Nous vous répondons sous 24h.',
      data: lead,
    })
  } catch (error) {
    next(error)
  }
}

exports.getAllLeads = async (req, res, next) => {
  try {
    const { status, service, page = 1, limit = 25 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    const where = {}
    if (status) where.status = status
    if (service) where.service = service

    const [total, leads] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
    ])

    res.json({
      success: true,
      pagination: {
        total,
        page: parseInt(page),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
      data: leads,
    })
  } catch (error) {
    next(error)
  }
}

exports.updateLeadStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status, notes } = req.body

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
    })

    res.json({ success: true, message: 'Prospect mis à jour', data: updated })
  } catch (error) {
    next(error)
  }
}

exports.deleteLead = async (req, res, next) => {
  try {
    const { id } = req.params
    await prisma.lead.delete({ where: { id } })
    res.json({ success: true, message: 'Prospect supprimé' })
  } catch (error) {
    next(error)
  }
}
