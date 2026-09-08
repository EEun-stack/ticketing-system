const prisma = require('../../config/prisma')
const { recordActivity } = require('../../utils/activityLog')

async function claimRequest(request, response, next) {
  try {
    const actor = await prisma.user.findUnique({
      where: { id: request.auth.sub },
      select: { id: true, email: true, name: true },
    })
    if (!actor) return response.status(401).json({ message: 'Authenticated user not found.' })

    const claimedByName = actor.name || actor.email
    const result = await prisma.supportRequest.updateMany({
      where: { id: request.params.id, claimedById: null },
      data: { claimedById: actor.id, claimedByName },
    })
    if (!result.count) {
      const current = await prisma.supportRequest.findUnique({
        where: { id: request.params.id },
        select: { id: true, claimedByName: true },
      })
      if (!current) return response.status(404).json({ message: 'Request not found.' })
      return response.status(409).json({ message: `This ticket is claimed by ${current.claimedByName || 'another admin'}.` })
    }

    const updated = await prisma.supportRequest.findUnique({ where: { id: request.params.id } })
    await recordActivity(request, {
      action: 'REQUEST_CLAIMED',
      entityType: 'SupportRequest',
      entityId: updated.id,
      details: { claimedBy: claimedByName },
    })
    return response.json(updated)
  } catch (error) {
    return next(error)
  }
}

module.exports = claimRequest