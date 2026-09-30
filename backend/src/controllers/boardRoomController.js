const prisma = require('../config/prisma')
const { recordActivity } = require('../utils/activityLog')

function normalizeDate(value) {
  const date = new Date(`${String(value || '').trim()}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

function bookingView(booking) {
  return booking
}

async function lockBookingDate(transaction, date) {
  const dateKey = date.toISOString().slice(0, 10)
  await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('board-room-booking'), hashtext(${dateKey}))`
}

async function createBooking(request, response, next) {
  try {
    const { name, department, date: dateValue, startTime, endTime, attendees, purpose } = request.body
    const employeeId = String(request.body.employeeId || '').trim().toUpperCase()
    const date = normalizeDate(dateValue)
    const attendeeCount = Number(attendees)
    if (employeeId.length > 64) return response.status(400).json({ message: 'Employee ID must be 64 characters or fewer.' })
    if (!String(name || '').trim() || !String(department || '').trim() || !date || !/^\d{2}:\d{2}$/.test(String(startTime || '')) || !/^\d{2}:\d{2}$/.test(String(endTime || '')) || String(endTime) <= String(startTime) || !Number.isInteger(attendeeCount) || attendeeCount < 1 || attendeeCount > 30 || !String(purpose || '').trim()) {
      return response.status(400).json({ message: 'Complete all board room booking fields with valid values.' })
    }
    if (date.getUTCDay() === 0 || date.getUTCDay() === 6 || date < new Date(new Date().toISOString().slice(0, 10))) {
      return response.status(400).json({ message: 'Board room bookings are only available for future weekdays.' })
    }

    const booking = await prisma.$transaction(async (transaction) => {
      await lockBookingDate(transaction, date)
      const existingBooking = await transaction.boardRoomBooking.findFirst({
        where: { date, status: { in: ['PENDING', 'APPROVED'] } },
        select: { id: true },
      })
      if (existingBooking) return null

      return transaction.boardRoomBooking.create({
        data: {
          employeeId: employeeId || null,
          name: String(name).trim(),
          department: String(department).trim(),
          date,
          startTime: String(startTime),
          endTime: String(endTime),
          attendees: attendeeCount,
          purpose: String(purpose).trim(),
        },
      })
    })
    if (!booking) {
      return response.status(409).json({ message: 'A board room meeting is already scheduled for this day. Please choose another date.' })
    }
    await recordActivity(request, {
      action: 'BOARD_ROOM_BOOKING_CREATED',
      entityType: 'BoardRoomBooking',
      entityId: booking.id,
      details: { date: dateValue, startTime, endTime, department: booking.department },
    })
    return response.status(201).json(bookingView(booking))
  } catch (error) {
    return next(error)
  }
}

async function listAvailability(request, response, next) {
  try {
    const month = String(request.query.month || '')
    if (!/^\d{4}-\d{2}$/.test(month)) return response.status(400).json({ message: 'Month must use YYYY-MM format.' })
    const start = new Date(`${month}-01T00:00:00.000Z`)
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1))
    const bookings = await prisma.boardRoomBooking.findMany({
      where: { date: { gte: start, lt: end }, status: { in: ['PENDING', 'APPROVED'] } },
      select: { date: true, startTime: true, endTime: true, status: true, purpose: true },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    })
    return response.json(bookings)
  } catch (error) {
    return next(error)
  }
}

async function getBookingStatus(request, response, next) {
  try {
    const booking = await prisma.boardRoomBooking.findUnique({
      where: { id: request.params.id },
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
        attendees: true,
        status: true,
        purpose: true,
        reviewedByName: true,
        reviewedAt: true,
        createdAt: true,
      },
    })
    if (!booking) return response.status(404).json({ message: 'Board room booking not found.' })
    return response.json(booking)
  } catch (error) {
    return next(error)
  }
}

async function listBookings(request, response, next) {
  try {
    const where = {}
    const fromDate = normalizeDate(request.query.dateFrom)
    const toDate = normalizeDate(request.query.dateTo)
    const name = String(request.query.name || '').trim()
    const department = String(request.query.unit || '').trim()
    const status = String(request.query.status || '').trim()
    const scope = String(request.query.scope || '').trim()

    if (fromDate || toDate) {
      where.date = {}
      if (fromDate) where.date.gte = fromDate
      if (toDate) where.date.lte = toDate
    }
    if (name) where.name = { contains: name, mode: 'insensitive' }
    if (department) where.department = department
    if (['PENDING', 'APPROVED', 'DECLINED', 'CANCELLED'].includes(status)) where.status = status
    if (scope === 'mine') where.reviewedById = request.auth.sub

    const bookings = await prisma.boardRoomBooking.findMany({ where, orderBy: { createdAt: 'desc' } })
    return response.json(bookings.map(bookingView))
  } catch (error) {
    return next(error)
  }
}

async function updateBookingStatus(request, response, next) {
  try {
    const status = String(request.body.status || '')
    if (!['PENDING', 'APPROVED', 'DECLINED', 'CANCELLED'].includes(status)) return response.status(400).json({ message: 'Invalid booking status.' })
    const booking = await prisma.boardRoomBooking.findUnique({ where: { id: request.params.id } })
    if (!booking) return response.status(404).json({ message: 'Board room booking not found.' })
    let updated
    if (status === 'APPROVED') {
      updated = await prisma.$transaction(async (transaction) => {
        await lockBookingDate(transaction, booking.date)
        const conflictingBooking = await transaction.boardRoomBooking.findFirst({
          where: { id: { not: booking.id }, date: booking.date, status: { in: ['PENDING', 'APPROVED'] } },
          select: { id: true },
        })
        if (conflictingBooking) return null
        return transaction.boardRoomBooking.update({
          where: { id: booking.id },
          data: {
            status,
            reviewedById: request.auth.id,
            reviewedByName: request.auth.name || request.auth.email,
            reviewedAt: new Date(),
          },
        })
      })
      if (!updated) {
        return response.status(409).json({ message: 'This day already has an active board room meeting. Choose another date.' })
      }
    } else {
      updated = await prisma.boardRoomBooking.update({
        where: { id: booking.id },
        data: {
          status,
          reviewedById: status === 'PENDING' ? null : request.auth.id,
          reviewedByName: status === 'PENDING' ? null : request.auth.name || request.auth.email,
          reviewedAt: status === 'PENDING' ? null : new Date(),
        },
      })
    }
    await recordActivity(request, { action: `BOARD_ROOM_BOOKING_${status}`, entityType: 'BoardRoomBooking', entityId: updated.id, details: { status } })
    return response.json(updated)
  } catch (error) {
    return next(error)
  }
}

async function deleteBooking(request, response, next) {
  try {
    const booking = await prisma.boardRoomBooking.findUnique({ where: { id: request.params.id } })
    if (!booking) return response.status(404).json({ message: 'Board room booking not found.' })

    await prisma.boardRoomBooking.delete({ where: { id: booking.id } })
    await recordActivity(request, {
      action: 'BOARD_ROOM_BOOKING_DELETED',
      entityType: 'BoardRoomBooking',
      entityId: booking.id,
      details: { date: booking.date, startTime: booking.startTime, name: booking.name },
    })
    return response.status(204).send()
  } catch (error) {
    return next(error)
  }
}

module.exports = { createBooking, deleteBooking, getBookingStatus, listAvailability, listBookings, updateBookingStatus }