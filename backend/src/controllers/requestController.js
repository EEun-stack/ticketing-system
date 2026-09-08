const prisma = require('../config/prisma')
const { recordActivity } = require('../utils/activityLog')

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

    const supportRequest = await prisma.supportRequest.create({
      data: {
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
      details: { employeeName: supportRequest.employeeName, department: supportRequest.department, requestType: supportRequest.requestType },
    })
    return response.status(201).json(supportRequest)
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
        status: true,
        claimedByName: true,
        statusUpdatedByName: true,
        createdAt: true,
        resolvedAt: true,
      },
    })
    if (!supportRequest) return response.status(404).json({ message: 'Request not found.' })
    return response.json(supportRequest)
  } catch (error) {
    return next(error)
  }
}

module.exports = { createRequest, defaultSettings, getRequestStatus, getSettings }