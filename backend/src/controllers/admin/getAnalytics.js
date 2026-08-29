const prisma = require('../../config/prisma')
const { buildRequestWhere } = require('../../utils/adminRequestFilters')

async function getAnalytics(request, response, next) {
  try {
    const where = buildRequestWhere(request.query)
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