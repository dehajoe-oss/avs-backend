// backend/src/controllers/appointmentController.js
const prisma = require('../lib/prisma')

exports.createAppointment = async (req, res, next) => {
  try {
    const {
      clientName,
      clientPhone,
      clientEmail,
      animalType,
      serviceType,
      appointmentDate,
      addressOrFarm,
      notes,
    } = req.body

    if (!clientName || !clientPhone || !appointmentDate) {
      return res.status(400).json({
        success: false,
        message: 'Nom, téléphone et date souhaitée sont obligatoires.',
      })
    }

    const appointment = await prisma.appointment.create({
      data: {
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: clientEmail ? clientEmail.trim().toLowerCase() : null,
        animalType: animalType || 'Animal de compagnie / Élevage',
        serviceType: serviceType || 'CONSULTATION_CABINET',
        appointmentDate: new Date(appointmentDate),
        addressOrFarm: addressOrFarm || null,
        notes: notes || null,
        userId: req.user?.id || null,
      },
    })

    res.status(201).json({
      success: true,
      message: 'Demande de rendez-vous enregistrée. Le secrétariat vétérinaire vous contacte pour confirmation.',
      data: appointment,
    })
  } catch (error) {
    next(error)
  }
}

exports.getAllAppointments = async (req, res, next) => {
  try {
    const { status, serviceType, date } = req.query
    const where = {}

    if (status) where.status = status
    if (serviceType) where.serviceType = serviceType
    if (date) {
      const target = new Date(date)
      const nextDay = new Date(target)
      nextDay.setDate(nextDay.getDate() + 1)
      where.appointmentDate = { gte: target, lt: nextDay }
    }

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { appointmentDate: 'asc' },
    })

    res.json({ success: true, count: appointments.length, data: appointments })
  } catch (error) {
    next(error)
  }
}

exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status, notes } = req.body

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
    })

    res.json({ success: true, message: 'Statut du rendez-vous mis à jour', data: updated })
  } catch (error) {
    next(error)
  }
}
