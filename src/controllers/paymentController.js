// backend/src/controllers/paymentController.js
const prisma = require('../lib/prisma')

/**
 * Valide une transaction de paiement KKiaPay pour une commande
 */
exports.verifyKKiaPay = async (req, res, next) => {
  try {
    const { orderId, orderNumber, transactionId, paymentDetails } = req.body

    if ((!orderId && !orderNumber) || !transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Identifiant de commande (orderId ou orderNumber) et référence de transaction (transactionId) requis.',
      })
    }

    // Recherche de la commande
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          ...(orderId ? [{ id: orderId }] : []),
          ...(orderNumber ? [{ orderNumber: orderNumber }] : []),
        ],
      },
    })

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande introuvable.',
      })
    }

    // Mise à jour du statut de paiement
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'PAID',
        paymentRef: transactionId,
        paymentMethod: 'KKIAPAY',
        status: order.status === 'PENDING' ? 'CONFIRMED' : order.status,
        notes: order.notes
          ? `${order.notes} | KKiaPay Tx: ${transactionId}`
          : `KKiaPay Tx: ${transactionId}`,
      },
      include: {
        items: true,
      },
    })

    res.json({
      success: true,
      message: 'Paiement KKiaPay validé avec succès.',
      data: updatedOrder,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Webhook pour réception asynchrone des événements de paiement KKiaPay
 */
exports.kkiapayWebhook = async (req, res, next) => {
  try {
    const event = req.body
    const transactionId = event?.transactionId || event?.id
    const state = event?.state || event?.status
    const orderRef = event?.customData?.orderNumber || event?.customData?.orderId

    if (!transactionId || !orderRef) {
      return res.status(200).json({ received: true, ignored: true })
    }

    if (state === 'SUCCESS' || state === 'COMPLETED' || state === 'PAID') {
      const order = await prisma.order.findFirst({
        where: {
          OR: [{ id: orderRef }, { orderNumber: orderRef }],
        },
      })

      if (order) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'PAID',
            paymentRef: transactionId,
            status: order.status === 'PENDING' ? 'CONFIRMED' : order.status,
          },
        })
      }
    }

    res.status(200).json({ success: true, message: 'Webhook traité.' })
  } catch (error) {
    next(error)
  }
}

/**
 * Initiation d'un paiement Mobile Money local (Airtel Money / MTN MoMo Congo)
 */
exports.initiateMobileMoney = async (req, res, next) => {
  try {
    const { orderId, orderNumber, phone, provider } = req.body

    if (!phone || (!orderId && !orderNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Numéro de téléphone et référence de commande requis.',
      })
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          ...(orderId ? [{ id: orderId }] : []),
          ...(orderNumber ? [{ orderNumber: orderNumber }] : []),
        ],
      },
    })

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande introuvable.',
      })
    }

    // Détection opérateur Congo : MTN (+242 06...) ou Airtel (+242 04... / 05...)
    const cleanPhone = phone.replace(/\s+/g, '')
    const selectedProvider = provider || (cleanPhone.includes('06') ? 'MTN_MOMO' : 'AIRTEL_MONEY')

    // Préparation de la transaction
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentMethod: selectedProvider,
        paymentStatus: 'PENDING',
      },
    })

    res.json({
      success: true,
      message: `Demande de paiement ${selectedProvider === 'MTN_MOMO' ? 'MTN MoMo' : 'Airtel Money'} enregistrée.`,
      data: {
        orderNumber: updated.orderNumber,
        amount: updated.totalAmount,
        phone: cleanPhone,
        provider: selectedProvider,
        instructions: `Veuillez valider le débit de ${updated.totalAmount.toLocaleString('fr-FR')} FCFA sur votre téléphone (${cleanPhone}).`,
      },
    })
  } catch (error) {
    next(error)
  }
}
