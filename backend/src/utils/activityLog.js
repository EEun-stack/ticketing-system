const prisma = require('../config/prisma')

async function getActor(request, actor = {}) {
  const actorId = actor.actorId || request.auth?.sub || null
  let actorName = actor.actorName || request.auth?.name || null
  let actorEmail = actor.actorEmail || request.auth?.email || null

  if (actorId && (!actorName || !actorEmail)) {
    const user = await prisma.user.findUnique({
      where: { id: actorId },
      select: { name: true, email: true },
    })
    actorName ||= user?.name || null
    actorEmail ||= user?.email || null
  }

  return { actorId, actorName, actorEmail }
}

async function recordActivity(request, { action, entityType, entityId, details, actor }) {
  try {
    await prisma.activityLog.create({
      data: {
        ...(await getActor(request, actor)),
        action,
        entityType,
        entityId: entityId || null,
        details: details || undefined,
        ipAddress: request.ip || null,
      },
    })
  } catch (error) {
    console.error('Unable to record activity log:', error)
  }
}

module.exports = { recordActivity }