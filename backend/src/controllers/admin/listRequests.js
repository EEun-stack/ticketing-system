const prisma = require('../../config/prisma')
const { buildActorRequestScope, buildRequestWhere } = require('../../utils/adminRequestFilters')

async function listRequests(request, response, next) {
  try {
    const actorId = request.auth?.role === 'ADMIN' && request.query.scope === 'mine' ? request.auth.sub : null
    const where = actorId ? await buildActorRequestScope(prisma, actorId, request.query) : buildRequestWhere(request.query)

    const requests = await prisma.supportRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return response.json(requests)
  } catch (error) {
    return next(error)
  }
}

module.exports = listRequests