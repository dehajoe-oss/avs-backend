// backend/src/controllers/orderController.js
const prisma = require('../lib/prisma')

function generateOrderNumber() {
  const date = new Date()
  const year = date.getFullYear()
  const random = Math.floor(1000 + Math.random() * 9000)
  return `AVS-${year}-${random}`
}

exports.createOrder = async (req, res, next) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      customerCity,
      items,
      paymentMethod,
      notes,
    } = req.body

    if (!customerName || !customerPhone || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nom, téléphone et au moins un article sont requis pour passer commande.',
      })
    }

    let totalAmount = 0
    const orderItemsData = []

    // Vérification des prix et calcul sécurisé côté serveur
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Chaque article doit avoir un productId et une quantité valide.',
        })
      }

      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      })

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Produit introuvable (ID: ${item.productId})`,
        })
      }

      const price = product.promoPrice || product.price
      const itemTotal = price * item.quantity
      totalAmount += itemTotal

      orderItemsData.push({
        productId: product.id,
        title: product.title,
        quantity: item.quantity,
        unitPrice: price,
        total: itemTotal,
      })
    }

    const orderNumber = generateOrderNumber()

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: req.user?.id || null,
        customerName: customerName.trim(),
        customerEmail: customerEmail ? customerEmail.trim().toLowerCase() : '',
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress || '',
        customerCity: customerCity || 'Pointe-Noire',
        totalAmount,
        paymentMethod: paymentMethod || 'AIRTEL_MONEY',
        notes: notes || null,
        items: {
          create: orderItemsData,
        },
      },
      include: { items: true },
    })

    res.status(201).json({
      success: true,
      message: 'Commande enregistrée avec succès !',
      data: order,
    })
  } catch (error) {
    next(error)
  }
}

exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, count: orders.length, data: orders })
  } catch (error) {
    next(error)
  }
}

exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, paymentStatus, page = 1, limit = 20 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    const where = {}
    if (status) where.status = status
    if (paymentStatus) where.paymentStatus = paymentStatus

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: { items: true, user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
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
      data: orders,
    })
  } catch (error) {
    next(error)
  }
}

exports.getOrderByNumber = async (req, res, next) => {
  try {
    const { orderNumber } = req.params
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    })

    if (!order) {
      return res.status(404).json({ success: false, message: 'Commande introuvable' })
    }

    res.json({ success: true, data: order })
  } catch (error) {
    next(error)
  }
}

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status, paymentStatus } = req.body

    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(paymentStatus && { paymentStatus }),
      },
      include: { items: true },
    })

    res.json({ success: true, message: 'Statut de commande mis à jour', data: updated })
  } catch (error) {
    next(error)
  }
}
