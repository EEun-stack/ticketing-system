const prisma = require('../../config/prisma')
const { allowedStatuses, buildActorRequestScope, buildRequestWhere } = require('../../utils/adminRequestFilters')

async function getAnalytics(request, response, next) {
  try {
    response.set('Cache-Control', 'no-store')

    const actorId = request.auth?.role === 'ADMIN' ? request.auth.sub : null
    const where = actorId ? await buildActorRequestScope(prisma, actorId, request.query) : buildRequestWhere(request.query)

    if (request.auth?.role === 'ADMIN') {
      const [grouped, recent] = await Promise.all([
        prisma.supportRequest.groupBy({
          by: ['status'],
          where,
          _count: { _all: true },
        }),
        prisma.supportRequest.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 8,
        }),
      ])

      const statusCounts = Object.fromEntries(allowedStatuses.map((status) => [status, 0]))

      for (const item of grouped) {
        if (allowedStatuses.includes(item.status)) {
          statusCounts[item.status] = item._count._all
        }
      }

      return response.json({
        total: Object.values(statusCounts).reduce((sum, value) => sum + value, 0),
        statusCounts,
        recent,
      })
    }

    const activityNow = new Date()
    const activityYear = activityNow.getUTCFullYear()
    const activityStart = new Date(Date.UTC(activityYear, 0, 1))
    const activityEnd = new Date(Date.UTC(activityYear + 1, 0, 1))
    const [total, grouped, recent, adminActivity, monthlyByDepartment, activityLogs] = await Promise.all([
      prisma.supportRequest.count({ where }),
      prisma.supportRequest.groupBy({ by: ['status'], where, _count: { _all: true } }),
      prisma.supportRequest.findMany({ where, orderBy: { createdAt: 'desc' }, take: 8 }),
      prisma.activityLog.groupBy({
        by: ['actorName', 'actorEmail'],
        where: {
          action: { in: ['REQUEST_CREATED', 'REQUEST_STATUS_UPDATED'] },
          actorName: { not: null },
          ...(Object.keys(where).length ? { AND: [{ OR: [{ entityType: 'SupportRequest' }] }] } : {}),
        },
        _count: { _all: true },
      }),
      prisma.supportRequest.groupBy({
        by: ['department'],
        where: {
          ...where,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            ...(where.createdAt || {}),
          },
        },
        _count: { _all: true },
      }),
      prisma.activityLog.findMany({
        where: {
          action: 'GUEST_LOGIN',
          createdAt: { gte: activityStart, lt: activityEnd },
        },
        select: { createdAt: true, actorName: true, actorEmail: true },
      }),
    ])

    const statusCounts = Object.fromEntries(grouped.map(({ status, _count }) => [status, _count._all]))
    const superAdminEmail = (process.env.SUPERADMIN_EMAIL || '').trim().toLowerCase()
    const normalizedAdminActivity = adminActivity
      .filter((item) => {
        const actorName = (item.actorName || '').trim().toLowerCase()
        const actorEmail = (item.actorEmail || '').trim().toLowerCase()
        const isSuperAdmin = Boolean(
          superAdminEmail && (actorEmail === superAdminEmail || actorName.includes('superadmin') || actorName.includes('super admin')),
        )

        return Boolean(item.actorName || item.actorEmail) && !isSuperAdmin
      })
      .map((item) => ({
        name: item.actorName || item.actorEmail || 'Unknown admin',
        email: item.actorEmail || null,
        count: item._count._all,
      }))
      .sort((a, b) => b.count - a.count)

    const normalizedMonthlyByDepartment = monthlyByDepartment
      .filter((item) => item.department)
      .map((item) => ({
        department: item.department,
        count: item._count._all,
      }))
      .sort((a, b) => b.count - a.count)

    const monthlyUserActivity = Array.from({ length: 12 }, (_, index) => ({
      month: `${activityYear}-${String(index + 1).padStart(2, '0')}`,
      logins: 0,
    }))
    const activityByMonth = new Map(monthlyUserActivity.map((item) => [item.month, item]))
    for (const log of activityLogs) {
      const month = activityByMonth.get(log.createdAt.toISOString().slice(0, 7))
      if (!month) continue
      month.logins += 1
    }

    return response.json({
      total,
      statusCounts,
      recent,
      adminActivity: normalizedAdminActivity,
      monthlyByDepartment: normalizedMonthlyByDepartment,
      monthlyUserActivity,
      monthlyUserActivityYear: activityYear,
    })
  } catch (error) {
    return next(error)
  }
}

module.exports = getAnalytics
