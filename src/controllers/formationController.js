// backend/src/controllers/formationController.js
const prisma = require('../lib/prisma')

// ── CATALOGUE DES FORMATIONS (PUBLIC & ADMIN) ──

/**
 * Récupère toutes les formations (avec filtre de statut pour l'admin)
 */
exports.getAllFormations = async (req, res, next) => {
  try {
    const { category, search, all } = req.query
    const where = {}

    // Par défaut pour le public, seulement les formations actives
    if (all !== 'true') {
      where.isActive = true
    }

    if (category && category !== 'all') {
      where.category = { contains: category, mode: 'insensitive' }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { target: { contains: search, mode: 'insensitive' } },
      ]
    }

    const formations = await prisma.formation.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    })

    res.json({
      success: true,
      count: formations.length,
      data: formations,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Détails d'une formation par slug ou ID
 */
exports.getFormationBySlug = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params

    const formation = await prisma.formation.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    })

    if (!formation) {
      return res.status(404).json({
        success: false,
        message: 'Formation introuvable.',
      })
    }

    res.json({ success: true, data: formation })
  } catch (error) {
    next(error)
  }
}

/**
 * Création d'une nouvelle formation (Admin / Staff)
 */
exports.createFormation = async (req, res, next) => {
  try {
    const {
      title,
      slug,
      category,
      duration,
      price,
      priceAmount,
      target,
      nextSession,
      modulesCovered,
      description,
      image,
      featured,
      order,
    } = req.body

    if (!title || !category || !price) {
      return res.status(400).json({
        success: false,
        message: 'Le titre, la catégorie et le tarif sont obligatoires.',
      })
    }

    const genSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const formation = await prisma.formation.create({
      data: {
        title: title.trim(),
        slug: genSlug,
        category: category.trim(),
        duration: duration || '3 à 5 Jours',
        price: price.trim(),
        priceAmount: Number(priceAmount) || 0,
        target: target || 'Éleveurs & Professionnels',
        nextSession: nextSession || 'Prochaine session à définir',
        modulesCovered: Array.isArray(modulesCovered) ? modulesCovered : [],
        description: description || null,
        image: image || '/images/ferme_ecole_avicole_1789164251928.jpg',
        featured: Boolean(featured),
        order: Number(order) || 0,
        isActive: true,
      },
    })

    res.status(201).json({
      success: true,
      message: 'Formation ajoutée avec succès au catalogue AVS.',
      data: formation,
    })
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Une formation avec ce titre ou cet identifiant slug existe déjà.',
      })
    }
    next(error)
  }
}

/**
 * Mise à jour d'une formation (Admin / Staff)
 */
exports.updateFormation = async (req, res, next) => {
  try {
    const { id } = req.params
    const data = { ...req.body }

    if (data.priceAmount !== undefined) data.priceAmount = Number(data.priceAmount)
    if (data.order !== undefined) data.order = Number(data.order)
    if (data.featured !== undefined) data.featured = Boolean(data.featured)
    if (data.isActive !== undefined) data.isActive = Boolean(data.isActive)

    const updated = await prisma.formation.update({
      where: { id },
      data,
    })

    res.json({
      success: true,
      message: 'Formation mise à jour avec succès.',
      data: updated,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Suppression d'une formation (Admin)
 */
exports.deleteFormation = async (req, res, next) => {
  try {
    const { id } = req.params

    await prisma.formation.delete({
      where: { id },
    })

    res.json({
      success: true,
      message: 'Formation supprimée avec succès.',
    })
  } catch (error) {
    next(error)
  }
}

// ── PRÉ-INSCRIPTIONS AUX FORMATIONS ──

/**
 * Pré-inscription d'un apprenant (Public)
 */
exports.registerFormation = async (req, res, next) => {
  try {
    const {
      fullName,
      phone,
      email,
      formationType,
      formationId,
      sessionDate,
      participantsCount,
      experience,
      notes,
    } = req.body

    if (!fullName || !phone || (!formationType && !formationId)) {
      return res.status(400).json({
        success: false,
        message: 'Nom complet, numéro WhatsApp et choix de la formation sont obligatoires.',
      })
    }

    let finalFormationType = formationType
    let resolvedFormationId = formationId || null
    let estimatedTotal = null

    if (formationId) {
      const f = await prisma.formation.findUnique({ where: { id: formationId } })
      if (f) {
        finalFormationType = f.title
        resolvedFormationId = f.id
        if (f.priceAmount > 0) {
          estimatedTotal = f.priceAmount * (Number(participantsCount) || 1)
        }
      }
    }

    const registration = await prisma.formationRegistration.create({
      data: {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email ? email.trim().toLowerCase() : null,
        formationType: finalFormationType ? finalFormationType.trim() : 'Formation AVS',
        formationId: resolvedFormationId,
        sessionDate: sessionDate ? new Date(sessionDate) : null,
        participantsCount: Number(participantsCount) || 1,
        totalAmount: estimatedTotal,
        experience: experience || 'Débutant',
        notes: notes || null,
        status: 'PENDING',
      },
      include: {
        formation: {
          select: { title: true, price: true, duration: true },
        },
      },
    })

    res.status(201).json({
      success: true,
      message: 'Pré-inscription validée ! Notre responsable pédagogique AVS vous contactera sous 48h.',
      data: registration,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Liste des pré-inscriptions (Admin / Staff)
 */
exports.getAllRegistrations = async (req, res, next) => {
  try {
    const { status, formationType, search } = req.query
    const where = {}

    if (status) where.status = status
    if (formationType) where.formationType = { contains: formationType, mode: 'insensitive' }
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    const registrations = await prisma.formationRegistration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        formation: {
          select: { id: true, title: true, price: true, category: true },
        },
      },
    })

    res.json({ success: true, count: registrations.length, data: registrations })
  } catch (error) {
    next(error)
  }
}

/**
 * Mise à jour du statut d'une inscription (Admin / Staff)
 */
exports.updateRegistrationStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status, notes, paymentStatus } = req.body

    const updated = await prisma.formationRegistration.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(paymentStatus && { paymentStatus }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        formation: true,
      },
    })

    res.json({ success: true, message: 'Statut de pré-inscription mis à jour', data: updated })
  } catch (error) {
    next(error)
  }
}
