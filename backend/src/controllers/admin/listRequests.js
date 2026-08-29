const prisma = require('../../config/prisma')
const { buildRequestWhere } = require('../../utils/adminRequestFilters')

async function listRequests(request, response, next) {
  try {
    const requests = await prisma.supportRequest.findMany({
      where: buildRequestWhere(request.query),
      orderBy: { createdAt: 'desc' },
    })
    return response.json(requests)
  } catch (error) {
    return next(error)
  }
}

module.exports = listRequests