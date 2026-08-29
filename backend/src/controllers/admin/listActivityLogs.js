const prisma = require('../../config/prisma')

async function listActivityLogs(request, response, next) {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    const requestIds = logs
      .filter((log) => log.entityType === 'SupportRequest' && log.entityId)
      .map((log) => log.entityId)
    const requests = await prisma.supportRequest.findMany({
      where: { id: { in: [...new Set(requestIds)] } },
      select: { id: true, employeeName: true, requestType: true },
    })
    const requestsById = new Map(requests.map((item) => [item.id, item]))

    return response.json(logs.map(({ id, createdAt, action, actorName, actorEmail, entityType, entityId, details }) => {
      const requestTarget = requestsById.get(entityId)
      return {
        id,
        createdAt,
        action,
        actorName,
        actorEmail,
        entityType,
        targetName: requestTarget?.employeeName || details?.employeeName || details?.requesterName || details?.name || details?.email || null,
        requestType: requestTarget?.requestType || details?.requestType || null,
      }
    }))
  } catch (error) {
    return next(error)
  }
}

module.exports = listActivityLogs