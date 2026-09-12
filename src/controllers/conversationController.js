// backend/src/controllers/conversationController.js
const prisma = require('../lib/prisma')

exports.getOrCreateConversation = async (req, res, next) => {
  try {
    const { sessionId, ipHash } = req.body

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId requis' })
    }

    const conversation = await prisma.conversation.upsert({
      where: { sessionId },
      update: {},
      create: {
        sessionId,
        ipHash: ipHash || null,
        status: 'ACTIVE',
      },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    })

    res.json({ success: true, data: conversation })
  } catch (error) {
    next(error)
  }
}

exports.addMessage = async (req, res, next) => {
  try {
    const { sessionId, role, content, modelUsed } = req.body

    if (!sessionId || !role || !content) {
      return res.status(400).json({ success: false, message: 'sessionId, role et content requis' })
    }

    const conversation = await prisma.conversation.findUnique({
      where: { sessionId },
    })

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation introuvable' })
    }

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId: conversation.id,
          role,
          content,
          modelUsed: modelUsed || null,
        },
      }),
      prisma.conversation.update({
        where: { id: conversation.id },
        data: { messageCount: { increment: 1 } },
      }),
    ])

    res.status(201).json({ success: true, data: message })
  } catch (error) {
    next(error)
  }
}

exports.listConversations = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 30 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    const where = {}
    if (status) where.status = status

    const [total, conversations] = await Promise.all([
      prisma.conversation.count({ where }),
      prisma.conversation.findMany({
        where,
        include: {
          messages: {
            take: 2,
            orderBy: { createdAt: 'desc' },
          },
        },
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
      data: conversations,
    })
  } catch (error) {
    next(error)
  }
}

exports.getConversationById = async (req, res, next) => {
  try {
    const { id } = req.params
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    })

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation introuvable' })
    }

    res.json({ success: true, data: conversation })
  } catch (error) {
    next(error)
  }
}
