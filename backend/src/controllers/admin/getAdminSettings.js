const prisma = require('../../config/prisma')
const { defaultSettings } = require('../requestController')

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

module.exports = getAdminSettings