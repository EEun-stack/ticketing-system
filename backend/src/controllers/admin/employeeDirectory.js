const bcrypt = require('bcryptjs')
const prisma = require('../../config/prisma')
const { recordActivity } = require('../../utils/activityLog')

const defaultEmployeePassword = '123456789'
const publicEmployeeFields = {
  id: true,
  employeeId: true,
  name: true,
  email: true,
  unit: true,
  designation: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
}

function normalizeEntry(entry = {}) {
  return {
    employeeId: String(entry.employeeId || '').trim().toUpperCase(),
    name: String(entry.name || '').trim(),
    email: String(entry.email || '').trim().toLowerCase(),
    unit: entry.unit === undefined ? undefined : String(entry.unit || '').trim(),
    designation: entry.designation === undefined ? undefined : String(entry.designation || '').trim(),
    isActive: typeof entry.isActive === 'boolean' ? entry.isActive : undefined,
  }
}

function isValidEntry(entry) {
  return entry.employeeId.length > 0 && entry.employeeId.length <= 64
    && entry.name.length > 0 && entry.name.length <= 160
    && entry.email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry.email)
    && (entry.unit === undefined || entry.unit.length <= 160)
    && (entry.designation === undefined || entry.designation.length <= 160)
}

async function listEmployees(request, response, next) {
  try {
    const employees = await prisma.employeeDirectoryEntry.findMany({
      select: publicEmployeeFields,
      orderBy: { name: 'asc' },
    })
    const requests = employees.length
      ? await prisma.supportRequest.findMany({
        where: { employeeId: { in: employees.map((employee) => employee.employeeId) } },
        orderBy: { createdAt: 'desc' },
        select: { employeeId: true, department: true, createdAt: true },
      })
      : []
    const latestRequestByEmployee = new Map()
    for (const request of requests) {
      if (!latestRequestByEmployee.has(request.employeeId)) {
        latestRequestByEmployee.set(request.employeeId, request)
      }
    }

    return response.json(employees.map((employee) => {
      const lastRequest = latestRequestByEmployee.get(employee.employeeId)
      return {
        ...employee,
        unit: employee.unit || lastRequest?.department || null,
        lastRequestAt: lastRequest?.createdAt || null,
        isActive: employee.isActive,
      }
    }))
  } catch (error) {
    return next(error)
  }
}

async function createEmployee(request, response, next) {
  const employee = normalizeEntry(request.body)
  if (!isValidEntry(employee)) {
    return response.status(400).json({ message: 'Employee ID, full name, and a valid email are required.' })
  }
  const password = typeof request.body.password === 'string' ? request.body.password : ''
  if (password && password.length < 8) {
    return response.status(400).json({ message: 'Password must be at least 8 characters.' })
  }

  try {
    const created = await prisma.employeeDirectoryEntry.create({
      data: {
        ...employee,
        passwordHash: await bcrypt.hash(password || defaultEmployeePassword, 12),
        unit: employee.unit || null,
        isActive: employee.isActive ?? true,
      },
      select: publicEmployeeFields,
    })
    await recordActivity(request, {
      action: 'EMPLOYEE_DIRECTORY_CREATED',
      entityType: 'EmployeeDirectoryEntry',
      entityId: created.id,
      details: { employeeId: created.employeeId, name: created.name, email: created.email },
    })
    return response.status(201).json(created)
  } catch (error) {
    if (error.code === 'P2002') {
      return response.status(409).json({ message: 'An employee with that ID or email already exists.' })
    }
    return next(error)
  }
}

async function updateEmployee(request, response, next) {
  const employee = normalizeEntry(request.body)
  if (!isValidEntry(employee)) {
    return response.status(400).json({ message: 'Employee ID, full name, and a valid email are required.' })
  }
  const password = typeof request.body.password === 'string' ? request.body.password : ''
  if (password && password.length < 8) {
    return response.status(400).json({ message: 'Password must be at least 8 characters.' })
  }

  try {
    const data = {
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email,
      ...(employee.unit !== undefined ? { unit: employee.unit || null } : {}),
      ...(employee.designation !== undefined ? { designation: employee.designation || null } : {}),
      ...(employee.isActive !== undefined ? { isActive: employee.isActive } : {}),
      ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}),
    }
    const updated = await prisma.employeeDirectoryEntry.update({
      where: { id: request.params.id },
      data,
      select: publicEmployeeFields,
    })
    await recordActivity(request, {
      action: 'EMPLOYEE_DIRECTORY_UPDATED',
      entityType: 'EmployeeDirectoryEntry',
      entityId: updated.id,
      details: {
        employeeId: updated.employeeId,
        name: updated.name,
        email: updated.email,
        unit: updated.unit,
        designation: updated.designation,
        isActive: updated.isActive,
        passwordChanged: Boolean(password),
      },
    })
    return response.json(updated)
  } catch (error) {
    if (error.code === 'P2002') {
      return response.status(409).json({ message: 'An employee with that ID or email already exists.' })
    }
    if (error.code === 'P2025') {
      return response.status(404).json({ message: 'Employee not found.' })
    }
    return next(error)
  }
}

async function deleteEmployee(request, response, next) {
  try {
    const employee = await prisma.employeeDirectoryEntry.findUnique({
      where: { id: request.params.id },
      select: { id: true, employeeId: true, name: true, email: true },
    })
    if (!employee) return response.status(404).json({ message: 'Employee not found.' })

    await prisma.employeeDirectoryEntry.delete({ where: { id: employee.id } })
    await recordActivity(request, {
      action: 'EMPLOYEE_DIRECTORY_DELETED',
      entityType: 'EmployeeDirectoryEntry',
      entityId: employee.id,
      details: { employeeId: employee.employeeId, name: employee.name, email: employee.email },
    })
    return response.json({ message: 'Employee deleted.' })
  } catch (error) {
    return next(error)
  }
}

async function importEmployees(request, response, next) {
  const rows = request.body?.employees
  if (!Array.isArray(rows) || rows.length === 0) {
    return response.status(400).json({ message: 'The import file has no employee rows.' })
  }
  if (rows.length > 100) {
    return response.status(400).json({ message: 'Import up to 100 employees per batch.' })
  }

  try {
    let created = 0
    let updated = 0
    const errors = []
    const seenIds = new Set()
    const seenEmails = new Set()

    for (const [index, row] of rows.entries()) {
      const employee = normalizeEntry(row)
      const rowNumber = index + 2
      if (!isValidEntry(employee)) {
        errors.push({ row: rowNumber, message: 'Employee ID, full name, and a valid email are required.' })
        continue
      }
      if (seenIds.has(employee.employeeId) || seenEmails.has(employee.email)) {
        errors.push({ row: rowNumber, message: 'This employee ID or email appears more than once in the file; the later row was skipped.' })
        continue
      }
      seenIds.add(employee.employeeId)
      seenEmails.add(employee.email)

      try {
        const [existing, emailOwner] = await Promise.all([
          prisma.employeeDirectoryEntry.findUnique({
            where: { employeeId: employee.employeeId },
            select: { id: true, name: true, email: true, unit: true, designation: true, isActive: true },
          }),
          prisma.employeeDirectoryEntry.findUnique({
            where: { email: employee.email },
            select: { employeeId: true },
          }),
        ])
        if (emailOwner && emailOwner.employeeId !== employee.employeeId) {
          errors.push({ row: rowNumber, message: 'This email is already assigned to another employee; the row was skipped.' })
          continue
        }
        if (existing
          && existing.name === employee.name
          && existing.email === employee.email
          && (employee.unit === undefined || existing.unit === (employee.unit || null))
          && (employee.designation === undefined || existing.designation === (employee.designation || null))
          && (employee.isActive === undefined || existing.isActive === employee.isActive)) {
          errors.push({ row: rowNumber, message: 'This employee is already in the database; the row was skipped.' })
          continue
        }

        const createData = {
          ...employee,
          unit: employee.unit || null,
          isActive: employee.isActive ?? true,
        }
        if (!existing) {
          createData.passwordHash = await bcrypt.hash(defaultEmployeePassword, 12)
        }
        await prisma.employeeDirectoryEntry.upsert({
          where: { employeeId: employee.employeeId },
          create: createData,
          update: {
            name: employee.name,
            email: employee.email,
            ...(employee.unit !== undefined ? { unit: employee.unit || null } : {}),
            ...(employee.designation !== undefined ? { designation: employee.designation || null } : {}),
            ...(employee.isActive !== undefined ? { isActive: employee.isActive } : {}),
          },
        })
        if (existing) updated += 1
        else created += 1
      } catch (error) {
        if (error.code === 'P2002') {
          errors.push({ row: rowNumber, message: 'An employee with this ID or email already exists; the row was skipped.' })
          continue
        }
        throw error
      }
    }

    await recordActivity(request, {
      action: 'EMPLOYEE_DIRECTORY_IMPORTED',
      entityType: 'EmployeeDirectoryEntry',
      details: { created, updated, errors: errors.length },
    })
    return response.json({ created, updated, errors })
  } catch (error) {
    return next(error)
  }
}

module.exports = { createEmployee, deleteEmployee, importEmployees, listEmployees, updateEmployee }