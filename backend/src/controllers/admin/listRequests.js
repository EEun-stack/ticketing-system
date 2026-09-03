const prisma = require('../../config/prisma')
const { buildActorRequestScope, buildRequestWhere } = require('../../utils/adminRequestFilters')

async function listRequests(request, response, next) {
  try {
    const aRole = request.auth?.role
    const actorId = aRole === 'ADMIN' && request.query.scope === 'mine' ? request.auth.sub : null

    let where = actorId ? await buildActorRequestScope(prisma, actorId, request.query) : buildRequestWhere(request.query)

    if (aRole === 'ADMIN') {
      const adminUser = await prisma.user.findUnique({
        where: { id: request.auth.sub },
        select: { expertise: true },
      })

      const expertise = Array.isArray(adminUser?.expertise)
        ? adminUser.expertise
        : typeof adminUser?.expertise === 'string'
          ? adminUser.expertise.split(',')
          : []

      const normalizedExpertise = expertise.map((value) => String(value).trim()).filter(Boolean)
      if (!normalizedExpertise.length) {
        return response.json([])
      }

      const requestedTypes = typeof request.query.requestType === 'string'
        ? request.query.requestType.split(',').map((value) => value.trim()).filter(Boolean)
        : []
      where = {
        ...where,
        requestType: {
          in: requestedTypes.length
            ? requestedTypes.filter((type) => normalizedExpertise.includes(type))
            : normalizedExpertise,
        },
      }
    }

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