const prisma = require('../config/prisma')
const { defaultSettings } = require('./requestController')

async function getAnalytics(request, response, next) {
  try {
    const [total, grouped, recent] = await Promise.all([
      prisma.supportRequest.count(),
      prisma.supportRequest.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.supportRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 8 }),
    ])

    const statusCounts = Object.fromEntries(grouped.map(({ status, _count }) => [status, _count._all]))
    return response.json({ total, statusCounts, recent })
  } catch (error) {
    return next(error)
  }
}

async function listRequests(request, response, next) {
  try {
    const requests = await prisma.supportRequest.findMany({ orderBy: { createdAt: 'desc' } })
    return response.json(requests)
  } catch (error) {
    return next(error)
  }
}

async function updateRequestStatus(request, response, next) {
  const allowedStatuses = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
  if (!allowedStatuses.includes(request.body.status)) {
    return response.status(400).json({ message: 'Invalid request status.' })
  }

  try {
    const updated = await prisma.supportRequest.update({
      where: { id: request.params.id },
      data: {
        status: request.body.status,
        resolvedAt: ['RESOLVED', 'CLOSED'].includes(request.body.status) ? new Date() : null,
      },
    })
    return response.json(updated)
  } catch (error) {
    return next(error)
  }
}

async function getAdminSettings(request, response, next) {
  try {
    const settings = await prisma.formSettings.upsert({
      where: { id: 1 }, update: {}, create: { id: 1, ...defaultSettings },
    })
    return response.json(settings)
  } catch (error) {
    return next(error)
  }
}

async function updateSettings(request, response, next) {
  const { title, description, requestTypes, priorities } = request.body
  if (!String(title || '').trim() || !String(description || '').trim()
    || !Array.isArray(requestTypes) || !requestTypes.length
    || !Array.isArray(priorities) || !priorities.length
    || [...requestTypes, ...priorities].some((value) => !String(value).trim())) {
    return response.status(400).json({ message: 'Settings must include text and at least one option in each list.' })
  }

  try {
    const settings = await prisma.formSettings.upsert({
      where: { id: 1 },
      update: { title: title.trim(), description: description.trim(), requestTypes, priorities },
      create: { id: 1, title: title.trim(), description: description.trim(), requestTypes, priorities },
    })
    return response.json(settings)
  } catch (error) {
    return next(error)
  }
}

module.exports = { getAdminSettings, getAnalytics, listRequests, updateRequestStatus, updateSettings }