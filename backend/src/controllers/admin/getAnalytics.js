const prisma = require('../../config/prisma')
const { allowedStatuses, buildActorRequestScope, buildRequestWhere } = require('../../utils/adminRequestFilters')

async function getAnalytics(request, response, next) {
  try {
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

    const [total, grouped, recent] = await Promise.all([
      prisma.supportRequest.count({ where }),
      prisma.supportRequest.groupBy({ by: ['status'], where, _count: { _all: true } }),
      prisma.supportRequest.findMany({ where, orderBy: { createdAt: 'desc' }, take: 8 }),
    ])

    const statusCounts = Object.fromEntries(grouped.map(({ status, _count }) => [status, _count._all]))
    return response.json({ total, statusCounts, recent })
  } catch (error) {
    return next(error)
  }
}

module.exports = getAnalytics