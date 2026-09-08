const prisma = require('../../config/prisma')
const { recordActivity } = require('../../utils/activityLog')
const { allowedStatuses } = require('../../utils/adminRequestFilters')

async function updateRequestStatus(request, response, next) {
  if (!allowedStatuses.includes(request.body.status)) {
    return response.status(400).json({ message: 'Invalid request status.' })
  }

  try {
    const [current, actor] = await Promise.all([
      prisma.supportRequest.findUnique({
        where: { id: request.params.id },
        select: { employeeName: true, requestType: true, status: true, claimedById: true, claimedByName: true },
      }),
      prisma.user.findUnique({
        where: { id: request.auth.sub },
        select: { id: true, email: true, name: true },
      }),
    ])
    if (!current) return response.status(404).json({ message: 'Request not found.' })
    if (!actor) return response.status(401).json({ message: 'Authenticated user not found.' })
    if (!current.claimedById) {
      return response.status(409).json({ message: 'Claim this ticket before changing its status.' })
    }
    if (current.claimedById !== actor.id) {
      return response.status(409).json({ message: `This ticket is claimed by ${current.claimedByName || 'another admin'}.` })
    }
    const isAdminRevert = current.status === 'RESOLVED'
      && request.auth.role === 'ADMIN'
      && request.body.status !== 'RESOLVED'
    if (current.status === 'RESOLVED' && request.auth.role !== 'SUPERADMIN' && !isAdminRevert) {
      return response.status(409).json({ message: 'Resolved requests cannot be changed.' })
    }
    if (isAdminRevert && request.body.confirmation !== 'REVERT') {
      return response.status(409).json({ message: 'Type REVERT to confirm reverting this request.' })
    }

    const updated = await prisma.supportRequest.update({
      where: { id: request.params.id },
      data: {
        status: request.body.status,
        statusUpdatedAt: new Date(),
        statusUpdatedByName: actor.name || actor.email,
        resolvedAt: request.body.status === 'RESOLVED' ? new Date() : null,
      },
    })
    await recordActivity(request, {
      action: 'REQUEST_STATUS_UPDATED',
      entityType: 'SupportRequest',
      entityId: updated.id,
      details: { requesterName: current.employeeName, requestType: current.requestType, from: current.status, to: updated.status },
    })
    return response.json(updated)
  } catch (error) {
    return next(error)
  }
}

module.exports = updateRequestStatus