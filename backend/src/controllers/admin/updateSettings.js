const prisma = require('../../config/prisma')
const { recordActivity } = require('../../utils/activityLog')

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
    await recordActivity(request, {
      action: 'SETTINGS_UPDATED',
      entityType: 'FormSettings',
      entityId: '1',
      details: { title: settings.title, units: settings.units, requestTypes: settings.requestTypes },
    })
    return response.json(settings)
  } catch (error) {
    return next(error)
  }
}

module.exports = updateSettings