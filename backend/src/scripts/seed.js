const bcrypt = require('bcryptjs')
require('../config/env')
const prisma = require('../config/prisma')

const seedAccounts = [
  {
    email: process.env.SUPERADMIN_EMAIL,
    password: process.env.SUPERADMIN_PASSWORD,
    role: 'SUPERADMIN',
  },
  {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    role: 'ADMIN',
  },
]

function validateSeedAccounts() {
  const invalidAccount = seedAccounts.find(
    ({ email, password }) => !email || !password || password.length < 12,
  )

  if (invalidAccount) {
    throw new Error(
      'Set SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD, ADMIN_EMAIL, and ADMIN_PASSWORD. Passwords must be at least 12 characters.',
    )
  }
}

async function seed() {
  validateSeedAccounts()

  for (const account of seedAccounts) {
    const passwordHash = await bcrypt.hash(account.password, 12)

    await prisma.user.upsert({
      where: { email: account.email.toLowerCase() },
      update: {
        passwordHash,
        role: account.role,
      },
      create: {
        email: account.email.toLowerCase(),
        passwordHash,
        role: account.role,
      },
    })

    console.log(`Seeded ${account.role}: ${account.email}`)
  }
}

seed()
  .catch((error) => {
    console.error('Database seed failed:', error.message)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
