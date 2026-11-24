const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../config/prisma')
const { recordActivity } = require('../utils/activityLog')
const { getCookieOptions } = require('./authController')

const invalidEmployeePasswordHash = '$2b$12$KQ16oKQPa12h4AJJ6.sKrOztqBb7Pfn3a2ZXAl3CB4KOZ3XzLnha.'

async function generateRequestControlId() {
  const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const prefix = `REQ-${dateStamp}-`

  const [{ nextSequence }] = await prisma.$queryRaw`
    SELECT nextval('support_request_control_id_seq')::bigint AS "nextSequence"
  `

  return `${prefix}${String(nextSequence).padStart(4, '0')}`
}

const defaultSettings = {
  title: 'IT Support Request',
  description: 'Tell us what you need help with and our IT team will get back to you.',
  units: ['Main Office'],
  requestTypes: ['Hardware', 'Software', 'Network', 'Account / Access', 'Printer', 'Other'],
  requestTypeOptions: {
    Hardware: ['Desktop', 'Laptop'],
    Software: ['Installation', 'Error'],
    Network: ['Internet', 'Wi-Fi'],
    'Account / Access': ['Password', 'Permission'],
    Printer: ['Cannot print', 'Paper jam'],
    Other: [],
  },
}


async function getSettings(request, response, next) {
  try {
    const settings = await prisma.formSettings.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, ...defaultSettings },
    })
    return response.json(settings)
  } catch (error) {
    return next(error)
  }
}

async function createRequest(request, response, next) {
  try {
    const requiredFields = ['employeeName', 'department', 'requestType']
    if (requiredFields.some((field) => !String(request.body[field] || '').trim())) {
      return response.status(400).json({ message: 'All required fields must be completed.' })
    }
    const employeeId = String(request.body.employeeId || '').trim().toUpperCase()
    if (employeeId.length > 64) return response.status(400).json({ message: 'Employee ID must be 64 characters or fewer.' })

    const controlId = await generateRequestControlId()
    const supportRequest = await prisma.supportRequest.create({
      data: {
        controlId,
        employeeId: employeeId || null,
        employeeName: String(request.body.employeeName).trim(),
        department: String(request.body.department).trim(),
        requestType: String(request.body.requestType).trim(),
        requestSubType: request.body.requestSubType ? String(request.body.requestSubType).trim() : null,
        contact: request.body.contact ? String(request.body.contact).trim() : null,
        subject: request.body.subject ? String(request.body.subject).trim() : null,
        description: request.body.description ? String(request.body.description).trim() : null,
      },
    })

    await recordActivity(request, {
      action: 'REQUEST_CREATED',
      entityType: 'SupportRequest',
      entityId: supportRequest.id,
      actor: { actorName: supportRequest.employeeName },
      details: {
        controlId: supportRequest.controlId,
        employeeName: supportRequest.employeeName,
        department: supportRequest.department,
        requestType: supportRequest.requestType,
      },
    })
    return response.status(201).json(supportRequest)
  } catch (error) {
    return next(error)
  }
}

async function getGuestHistory(request, response, next) {
  try {
    const employeeId = request.guest.employeeId

    const [requests, bookings] = await Promise.all([
      prisma.supportRequest.findMany({
        where: { employeeId },
        select: {
          id: true,
          controlId: true,
          requestType: true,
          requestSubType: true,
          subject: true,
          description: true,
          department: true,
          contact: true,
          status: true,
          statusUpdatedByName: true,
          statusUpdatedAt: true,
          claimedByName: true,
          createdAt: true,
          updatedAt: true,
          resolvedAt: true,
          feedback: true,
          feedbackRating: true,
          feedbackSubmittedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.boardRoomBooking.findMany({
        where: { employeeId },
        select: {
          id: true,
          date: true,
          startTime: true,
          endTime: true,
          attendees: true,
          status: true,
          purpose: true,
          department: true,
          reviewedByName: true,
          reviewedAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ])
    const activities = await prisma.activityLog.findMany({
      where: {
        entityId: request.guest.id,
        entityType: 'EmployeeDirectoryEntry',
        action: { in: ['GUEST_LOGIN', 'GUEST_LOGOUT', 'GUEST_PASSWORD_CHANGED'] },
      },
      select: { id: true, action: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    const requestIds = requests.map(({ id }) => id)
    const requestActivities = requestIds.length
      ? await prisma.activityLog.findMany({
        where: {
          entityType: 'SupportRequest',
          entityId: { in: requestIds },
          action: { in: ['REQUEST_CREATED', 'REQUEST_CLAIMED', 'REQUEST_STATUS_UPDATED'] },
        },
        select: {
          id: true,
          entityId: true,
          action: true,
          actorId: true,
          actorName: true,
          createdAt: true,
          details: true,
        },
        orderBy: { createdAt: 'desc' },
      })
      : []
    const actorIds = [...new Set(requestActivities.map(({ actorId }) => actorId).filter(Boolean))]
    const actors = actorIds.length
      ? await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, role: true },
      })
      : []
    const actorRoles = new Map(actors.map(({ id, role }) => [id, role]))
    const activitiesByRequest = requestActivities.reduce((activities, activity) => {
      if (!activities[activity.entityId]) activities[activity.entityId] = []
      activities[activity.entityId].push({
        id: activity.id,
        action: activity.action,
        actorName: activity.actorName,
        actorRole: actorRoles.get(activity.actorId) || null,
        createdAt: activity.createdAt,
        details: activity.details,
      })
      return activities
    }, {})

    return response.json({
      requests,
      requestActivities: activitiesByRequest,
      bookings: bookings.map((booking) => ({
        ...booking,
        date: booking.date.toISOString().slice(0, 10),
      })),
      activities,
    })
  } catch (error) {
    return next(error)
  }
}

async function verifyGuestEmployee(request, response, next) {
  const employeeId = String(request.body?.employeeId || '').trim().toUpperCase()
  const password = typeof request.body?.password === 'string' ? request.body.password : ''
  if (!employeeId || employeeId.length > 64 || !password || password.length > 128) {
    return response.status(400).json({ message: 'Enter your employee ID and password.' })
  }

  try {
    const employee = await prisma.employeeDirectoryEntry.findUnique({
      where: { employeeId },
      select: { id: true, name: true, unit: true, designation: true, isActive: true, passwordHash: true },
    })
    const passwordMatches = await bcrypt.compare(password, employee?.passwordHash || invalidEmployeePasswordHash)
    if (!employee || !passwordMatches) {
      return response.status(401).json({ message: 'Employee ID or password is incorrect.' })
    }
    if (!employee.isActive) {
      return response.status(403).json({ message: 'This account is inactive. Contact your administrator.' })
    }

    const lastRequest = await prisma.supportRequest.findFirst({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
      select: { department: true },
    })
    await recordActivity(request, {
      action: 'GUEST_LOGIN',
      entityType: 'EmployeeDirectoryEntry',
      entityId: employee.id,
      actor: { actorName: employee.name },
      details: { employeeId, employeeName: employee.name },
    })
    const token = jwt.sign(
      { employeeId: employee.employeeId, role: 'GUEST' },
      process.env.JWT_SECRET,
      { expiresIn: '24h', subject: employee.id },
    )
    response.cookie('guestAuthToken', token, {
      ...getCookieOptions(request),
      maxAge: 24 * 60 * 60 * 1000,
    })
    return response.json({
      valid: true,
      name: employee.name,
      unit: employee.unit || lastRequest?.department || '',
      designation: employee.designation || '',
    })
  } catch (error) {
    return next(error)
  }
}

async function recordGuestLogout(request, response, next) {
  try {
    const { employeeId, id, name } = request.guest
    await recordActivity(request, {
      action: 'GUEST_LOGOUT',
      entityType: 'EmployeeDirectoryEntry',
      entityId: id,
      actor: { actorName: name },
      details: { employeeId, employeeName: name },
    })
    response.clearCookie('guestAuthToken', getCookieOptions(request))
    return response.json({ recorded: true })
  } catch (error) {
    return next(error)
  }
}

async function changeGuestPassword(request, response, next) {
  const currentPassword = typeof request.body?.currentPassword === 'string' ? request.body.currentPassword : ''
  const newPassword = typeof request.body?.newPassword === 'string' ? request.body.newPassword : ''
  if (!currentPassword || currentPassword.length > 128) {
    return response.status(400).json({ message: 'Enter your current password.' })
  }
  if (newPassword.length < 8 || newPassword.length > 128) {
    return response.status(400).json({ message: 'New password must be between 8 and 128 characters.' })
  }

  try {
    const employeeId = request.guest.employeeId
    const employee = await prisma.employeeDirectoryEntry.findUnique({
      where: { id: request.guest.id },
      select: { id: true, name: true, isActive: true, passwordHash: true },
    })
    const passwordMatches = await bcrypt.compare(currentPassword, employee?.passwordHash || invalidEmployeePasswordHash)
    if (!employee || !passwordMatches) {
      return response.status(401).json({ message: 'Employee ID or current password is incorrect.' })
    }
    if (!employee.isActive) {
      return response.status(403).json({ message: 'This account is inactive. Contact your administrator.' })
    }

    await prisma.employeeDirectoryEntry.update({
      where: { id: employee.id },
      data: { passwordHash: await bcrypt.hash(newPassword, 12) },
    })
    await recordActivity(request, {
      action: 'GUEST_PASSWORD_CHANGED',
      entityType: 'EmployeeDirectoryEntry',
      entityId: employee.id,
      actor: { actorName: employee.name },
      details: { employeeId, employeeName: employee.name },
    })
    return response.json({ updated: true })
  } catch (error) {
    return next(error)
  }
}

async function getRequestStatus(request, response, next) {
  try {
    const supportRequest = await prisma.supportRequest.findUnique({
      where: { id: request.params.id },
      select: {
        id: true,
        controlId: true,
        status: true,
        claimedByName: true,
        statusUpdatedByName: true,
        createdAt: true,
        resolvedAt: true,
        feedback: true,
        feedbackRating: true,
        feedbackSubmittedAt: true,
      },
    })
    if (!supportRequest) return response.status(404).json({ message: 'Request not found.' })
    return response.json(supportRequest)
  } catch (error) {
    return next(error)
  }
}

async function submitFeedback(request, response, next) {
  try {
    const feedback = String(request.body.feedback || '').trim()
    const feedbackRating = Number(request.body.rating)
    if (!feedback) return response.status(400).json({ message: 'Feedback is required.' })
    if (feedback.length > 2000) return response.status(400).json({ message: 'Feedback must be 2000 characters or fewer.' })
    if (!Number.isInteger(feedbackRating) || feedbackRating < 1 || feedbackRating > 5) {
      return response.status(400).json({ message: 'Choose a rating from 1 to 5 stars.' })
    }

    const supportRequest = await prisma.supportRequest.findUnique({
      where: { id: request.params.id },
      select: { id: true, employeeId: true, employeeName: true, status: true, feedbackSubmittedAt: true },
    })
    if (!supportRequest) return response.status(404).json({ message: 'Request not found.' })
    if (supportRequest.status !== 'RESOLVED') {
      return response.status(409).json({ message: 'Feedback can only be submitted after the request is resolved.' })
    }
    if (supportRequest.feedbackSubmittedAt) {
      return response.status(409).json({ message: 'Feedback has already been submitted for this request.' })
    }

    const updatedRequest = await prisma.supportRequest.update({
      where: { id: request.params.id },
      data: { feedback, feedbackRating, feedbackSubmittedAt: new Date() },
      select: { id: true, status: true, feedback: true, feedbackRating: true, feedbackSubmittedAt: true },
    })
    await recordActivity(request, {
      action: 'REQUEST_FEEDBACK_SUBMITTED',
      entityType: 'SupportRequest',
      entityId: updatedRequest.id,
      actor: { actorName: supportRequest.employeeName },
      details: {
        employeeId: supportRequest.employeeId,
        employeeName: supportRequest.employeeName,
        feedbackLength: feedback.length,
        feedbackRating,
      },
    })
    return response.json(updatedRequest)
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  changeGuestPassword,
  createRequest,
  defaultSettings,
  getGuestHistory,
  getRequestStatus,
  getSettings,
  recordGuestLogout,
  submitFeedback,
  verifyGuestEmployee,
}