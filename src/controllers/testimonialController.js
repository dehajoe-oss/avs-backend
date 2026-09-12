// backend/src/controllers/testimonialController.js
const prisma = require('../lib/prisma')

/**
 * Récupère les témoignages publics approuvés
 */
exports.getAllApproved = async (req, res, next) => {
  try {
    const { featured } = req.query
    const where = { isApproved: true }

    if (featured === 'true') {
      where.isFeatured = true
    }

    const testimonials = await prisma.testimonial.findMany({
      where,
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    res.json({
      success: true,
      count: testimonials.length,
      data: testimonials,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Récupère tous les témoignages pour l'administration
 */
exports.getAllAdmin = async (req, res, next) => {
  try {
    const { approved, search } = req.query
    const where = {}

    if (approved !== undefined) {
      where.isApproved = approved === 'true'
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { role: { contains: search, mode: 'insensitive' } },
        { project: { contains: search, mode: 'insensitive' } },
        { text: { contains: search, mode: 'insensitive' } },
      ]
    }

    const testimonials = await prisma.testimonial.findMany({
      where,
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    res.json({
      success: true,
      count: testimonials.length,
      data: testimonials,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Créer un nouveau témoignage (Public ou Admin)
 */
exports.createTestimonial = async (req, res, next) => {
  try {
    const { name, role, project, rating, text, img, result, isApproved, isFeatured, order } = req.body

    if (!name || !text || !project) {
      return res.status(400).json({
        success: false,
        message: 'Le nom, le projet et le texte de l’avis sont obligatoires.',
      })
    }

    // Si l'utilisateur est authentifié staff/admin, il peut approuver directement
    const isAdminOrStaff = req.user && (req.user.role === 'ADMIN' || req.user.role === 'STAFF')
    const finalApproved = isAdminOrStaff ? (isApproved !== undefined ? Boolean(isApproved) : true) : false

    const testimonial = await prisma.testimonial.create({
      data: {
        name: name.trim(),
        role: role ? role.trim() : 'Éleveur / Client AVS',
        project: project.trim(),
        rating: Math.min(5, Math.max(1, Number(rating) || 5)),
        text: text.trim(),
        img: img || null,
        result: result ? result.trim() : null,
        isApproved: finalApproved,
        isFeatured: Boolean(isFeatured),
        order: Number(order) || 0,
      },
    })

    res.status(201).json({
      success: true,
      message: finalApproved
        ? 'Témoignage publié avec succès.'
        : 'Merci pour votre retour ! Votre avis sera vérifié par notre équipe avant publication.',
      data: testimonial,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Mise à jour d'un témoignage (Admin / Staff)
 */
exports.updateTestimonial = async (req, res, next) => {
  try {
    const { id } = req.params
    const data = { ...req.body }

    if (data.rating !== undefined) data.rating = Math.min(5, Math.max(1, Number(data.rating)))
    if (data.order !== undefined) data.order = Number(data.order)
    if (data.isApproved !== undefined) data.isApproved = Boolean(data.isApproved)
    if (data.isFeatured !== undefined) data.isFeatured = Boolean(data.isFeatured)

    const updated = await prisma.testimonial.update({
      where: { id },
      data,
    })

    res.json({
      success: true,
      message: 'Témoignage mis à jour avec succès.',
      data: updated,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Basculer l'approbation d'un avis (Admin / Staff)
 */
exports.toggleApproval = async (req, res, next) => {
  try {
    const { id } = req.params
    const { isApproved } = req.body

    const existing = await prisma.testimonial.findUnique({ where: { id } })
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Témoignage introuvable.' })
    }

    const nextState = isApproved !== undefined ? Boolean(isApproved) : !existing.isApproved

    const updated = await prisma.testimonial.update({
      where: { id },
      data: { isApproved: nextState },
    })

    res.json({
      success: true,
      message: nextState ? 'Témoignage approuvé et visible sur le site.' : 'Témoignage masqué.',
      data: updated,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Suppression d'un témoignage (Admin)
 */
exports.deleteTestimonial = async (req, res, next) => {
  try {
    const { id } = req.params

    await prisma.testimonial.delete({
      where: { id },
    })

    res.json({
      success: true,
      message: 'Témoignage supprimé avec succès.',
    })
  } catch (error) {
    next(error)
  }
}
