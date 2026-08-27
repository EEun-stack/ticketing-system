const prisma = require('../config/prisma')

const defaultSettings = {
  title: 'IT Support Request',
  description: 'Tell us what you need help with and our IT team will get back to you.',
  requestTypes: ['Hardware', 'Software', 'Network', 'Account / Access', 'Printer', 'Other'],
  priorities: ['Low', 'Medium', 'High', 'Urgent'],
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
    const fields = ['employeeName', 'department', 'contact', 'requestType', 'subject', 'description', 'priority']
    if (fields.some((field) => !String(request.body[field] || '').trim())) {
      return response.status(400).json({ message: 'All required fields must be completed.' })
    }

    const supportRequest = await prisma.supportRequest.create({
      data: Object.fromEntries(fields.map((field) => [field, String(request.body[field]).trim()])),
    })
    return response.status(201).json(supportRequest)
  } catch (error) {
    return next(error)
  }
}

module.exports = { createRequest, defaultSettings, getSettings }