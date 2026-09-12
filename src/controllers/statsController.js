// backend/src/controllers/statsController.js
const prisma = require('../lib/prisma')

exports.getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [
      totalOrders,
      ordersRevenue,
      totalLeads,
      qualifiedLeads,
      totalAppointments,
      totalRegistrations,
      totalVisitors,
      recentOrders,
      recentLeads,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { totalAmount: true },
      }),
      prisma.lead.count(),
      prisma.lead.count({ where: { status: 'QUALIFIED' } }),
      prisma.appointment.count(),
      prisma.formationRegistration.count(),
      prisma.visitor.count(),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
      prisma.lead.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    res.json({
      success: true,
      data: {
        kpis: {
          revenue: ordersRevenue._sum.totalAmount || 0,
          ordersCount: totalOrders,
          leadsCount: totalLeads,
          qualifiedLeads,
          appointmentsCount: totalAppointments,
          formationsCount: totalRegistrations,
          visitorsCount: totalVisitors,
        },
        recentOrders,
        recentLeads,
      },
    })
  } catch (error) {
    next(error)
  }
}

exports.trackPageView = async (req, res, next) => {
  try {
    const { visitorId, path, referrer, device } = req.body

    if (!visitorId || !path) {
      return res.status(400).json({ success: false, message: 'visitorId et path requis' })
    }

    const visitor = await prisma.visitor.upsert({
      where: { visitorId },
      update: { visitCount: { increment: 1 } },
      create: { visitorId },
    })

    await prisma.pageView.create({
      data: {
        visitorId: visitor.id,
        path,
        referrer: referrer || null,
        device: device || 'desktop',
      },
    })

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}
