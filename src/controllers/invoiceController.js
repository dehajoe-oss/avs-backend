// backend/src/controllers/invoiceController.js
const prisma = require('../lib/prisma')

function generateInvoiceNumber() {
  const date = new Date()
  const year = date.getFullYear()
  const random = Math.floor(1000 + Math.random() * 9000)
  return `FAC-${year}-${random}`
}

function calculateTotals(items = [], taxRate = 0, discount = 0) {
  let subtotal = 0
  const processedItems = items.map((item) => {
    const qty = parseFloat(item.quantity) || 1
    const price = parseFloat(item.unitPrice) || 0
    const amount = qty * price
    subtotal += amount
    return {
      description: item.description || 'Prestation',
      quantity: qty,
      unitPrice: price,
      amount,
    }
  })

  const taxAmount = (subtotal * (parseFloat(taxRate) || 0)) / 100
  const disc = parseFloat(discount) || 0
  const total = Math.max(0, subtotal + taxAmount - disc)

  return { subtotal, taxAmount, total, processedItems }
}

exports.createInvoice = async (req, res, next) => {
  try {
    const {
      clientName,
      clientEmail,
      clientPhone,
      clientAddress,
      clientCompany,
      dueDate,
      taxRate = 0,
      discount = 0,
      notes,
      items,
    } = req.body

    if (!clientName || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nom du client et au moins une ligne de facturation requis.',
      })
    }

    const { subtotal, taxAmount, total, processedItems } = calculateTotals(items, taxRate, discount)
    const invoiceNumber = generateInvoiceNumber()

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientName: clientName.trim(),
        clientEmail: clientEmail ? clientEmail.trim().toLowerCase() : null,
        clientPhone: clientPhone ? clientPhone.trim() : null,
        clientAddress: clientAddress || null,
        clientCompany: clientCompany || null,
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        taxRate: parseFloat(taxRate) || 0,
        taxAmount,
        discount: parseFloat(discount) || 0,
        subtotal,
        total,
        notes: notes || null,
        createdById: req.user?.id || null,
        items: {
          create: processedItems,
        },
      },
      include: { items: true },
    })

    res.status(201).json({ success: true, message: 'Facture créée avec succès', data: invoice })
  } catch (error) {
    next(error)
  }
}

exports.getAllInvoices = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    const where = {}
    if (status) where.status = status
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
        { clientCompany: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [total, invoices] = await Promise.all([
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        include: { items: true },
        orderBy: { date: 'desc' },
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
      data: invoices,
    })
  } catch (error) {
    next(error)
  }
}

exports.getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { items: true, createdBy: { select: { name: true, email: true } } },
    })

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Facture introuvable' })
    }

    res.json({ success: true, data: invoice })
  } catch (error) {
    next(error)
  }
}

exports.updateInvoiceStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const updated = await prisma.invoice.update({
      where: { id },
      data: { status },
      include: { items: true },
    })

    res.json({ success: true, message: 'Statut de facture actualisé', data: updated })
  } catch (error) {
    next(error)
  }
}

exports.deleteInvoice = async (req, res, next) => {
  try {
    const { id } = req.params
    await prisma.invoice.delete({ where: { id } })
    res.json({ success: true, message: 'Facture supprimée' })
  } catch (error) {
    next(error)
  }
}
