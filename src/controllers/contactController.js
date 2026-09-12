// backend/src/controllers/contactController.js
const prisma = require('../lib/prisma')

/**
 * Calcul de scoring de lead simple côté backend
 */
function scoreContactMessage(text = '', data = {}) {
  let score = 10
  const lower = (text + ' ' + (data.service || '')).toLowerCase()

  if (lower.match(/(budget|fcfa|cfa|euro|million|millier)/i)) score += 20
  if (lower.match(/(délai|urgent|rapidement|semaine|mois|jour)/i)) score += 20
  if (data.email && data.phone) score += 20
  if (lower.match(/(poussins|cobb|lohmann|provende|clinique|vaccin|formation|haccp|ferme|élevage)/i)) score += 20
  if (lower.match(/(devis|commander|acheter|besoin|souhaite)/i)) score += 10

  return Math.min(score, 100)
}

/**
 * Soumettre un message de contact ou demande de devis
 */
exports.submitContact = async (req, res, next) => {
  try {
    const { name, email, phone, service, subject, message, budgetRange, timeline } = req.body

    if (!name || !phone || !message) {
      return res.status(400).json({
        success: false,
        message: 'Nom, téléphone et message sont obligatoires.',
      })
    }

    const calculatedScore = scoreContactMessage(message, { service, email, phone })

    // Création du Lead dans la base de données
    const lead = await prisma.lead.create({
      data: {
        name,
        email: email || null,
        phone,
        service: service || subject || 'Général',
        budgetRange: budgetRange || null,
        timeline: timeline || null,
        message,
        score: calculatedScore,
        status: calculatedScore >= 60 ? 'QUALIFIED' : 'NEW',
        notes: subject ? `Objet: ${subject}` : null,
      },
    })

    res.status(201).json({
      success: true,
      message: 'Votre message a été transmis avec succès. L\'équipe AVS vous contactera sous 24h.',
      data: {
        id: lead.id,
        name: lead.name,
        service: lead.service,
        status: lead.status,
      },
    })
  } catch (error) {
    next(error)
  }
}
