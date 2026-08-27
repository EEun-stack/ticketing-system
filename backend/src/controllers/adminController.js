const bcrypt = require('bcryptjs')
const prisma = require('../config/prisma')
const { defaultSettings } = require('./requestController')

const allowedStatuses = ['NEW', 'PENDING', 'FOR_APPROVAL', 'IN_PROGRESS', 'RESOLVED']

function getDateValue(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function buildRequestWhere(query) {
  const where = {}
  const and = []
  const fromDate = getDateValue(query.dateFrom)
  const toDate = getDateValue(query.dateTo)

  if (fromDate || toDate) {
    where.createdAt = {}
    if (fromDate) where.createdAt.gte = fromDate
    if (toDate) {
      const endDate = new Date(toDate)
      endDate.setDate(endDate.getDate() + 1)
      where.createdAt.lt = endDate
    }
  }

  if (String(query.unit || '').trim()) {
    where.department = String(query.unit).trim()
  }

  if (allowedStatuses.includes(query.status)) {
    where.status = query.status
  }

  if (String(query.requestType || '').trim()) {
    where.requestType = String(query.requestType).trim()
  }

  if (String(query.name || '').trim()) {
    and.push({
      employeeName: {
        contains: String(query.name).trim(),
        mode: 'insensitive',
      },
    })
  }

  if (and.length) where.AND = and
  return where
}

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

async function updateRequestStatus(request, response, next) {
  if (!allowedStatuses.includes(request.body.status)) {
    return response.status(400).json({ message: 'Invalid request status.' })
  }

  try {
    const [current, actor] = await Promise.all([
      prisma.supportRequest.findUnique({
        where: { id: request.params.id },
        select: { status: true },
      }),
      prisma.user.findUnique({
        where: { id: request.auth.sub },
        select: { email: true, name: true },
      }),
    ])
    if (!current) return response.status(404).json({ message: 'Request not found.' })
    if (!actor) return response.status(401).json({ message: 'Authenticated user not found.' })
    if (current.status === 'RESOLVED') {
      return response.status(409).json({ message: 'Resolved requests cannot be changed.' })
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
    return response.json(updated)
  } catch (error) {
    return next(error)
  }
}

async function listAdminUsers(request, response, next) {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, createdAt: true },
    })
    return response.json(users)
  } catch (error) {
    return next(error)
  }
}

async function createAdminUser(request, response, next) {
  const name = String(request.body.name || '').trim()
  const email = String(request.body.email || '').trim().toLowerCase()
  const password = String(request.body.password || '')

  if (!name || !email || !password || password.length < 8) {
    return response.status(400).json({ message: 'Name, email, and an 8-character password are required.' })
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: 'ADMIN' },
      select: { id: true, name: true, email: true, createdAt: true },
    })
    return response.status(201).json(user)
  } catch (error) {
    if (error.code === 'P2002') {
      return response.status(409).json({ message: 'An admin user with that email already exists.' })
    }
    return next(error)
  }
}

async function deleteAdminUser(request, response, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: request.params.id },
      select: { role: true },
    })
    if (!user) return response.status(404).json({ message: 'Admin user not found.' })
    if (user.role !== 'ADMIN') {
      return response.status(400).json({ message: 'Only admin users can be deleted here.' })
    }

    await prisma.user.delete({ where: { id: request.params.id } })
    return response.json({ message: 'Admin user deleted.' })
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
  const { title, description, units, requestTypes, requestTypeOptions } = request.body
  if (!String(title || '').trim() || !String(description || '').trim()
    || !Array.isArray(units) || !units.length
    || !Array.isArray(requestTypes) || !requestTypes.length
    || !requestTypeOptions || typeof requestTypeOptions !== 'object'
    || [...units, ...requestTypes].some((value) => !String(value).trim())
    || requestTypes.some((type) => !Array.isArray(requestTypeOptions[type])
      || requestTypeOptions[type].some((value) => !String(value).trim()))) {
    return response.status(400).json({ message: 'Settings must include text and at least one option in each list.' })
  }

  try {
    const settings = await prisma.formSettings.upsert({
      where: { id: 1 },
      update: { title: title.trim(), description: description.trim(), units, requestTypes, requestTypeOptions },
      create: { id: 1, title: title.trim(), description: description.trim(), units, requestTypes, requestTypeOptions },
    })
    return response.json(settings)
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  createAdminUser,
  deleteAdminUser,
  getAdminSettings,
  getAnalytics,
  listAdminUsers,
  listRequests,
  updateRequestStatus,
  updateSettings,
}
