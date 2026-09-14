const prisma = require('../config/prisma')
const { recordActivity } = require('../utils/activityLog')

function normalizeDate(value) {
  const date = new Date(`${String(value || '').trim()}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

function bookingView(booking) {
  return booking
}

async function createBooking(request, response, next) {
  try {
    const { name, department, date: dateValue, startTime, attendees, purpose } = request.body
    const date = normalizeDate(dateValue)
    const attendeeCount = Number(attendees)
    if (!String(name || '').trim() || !String(department || '').trim() || !date || !/^\d{2}:\d{2}$/.test(String(startTime || '')) || !Number.isInteger(attendeeCount) || attendeeCount < 1 || attendeeCount > 30 || !String(purpose || '').trim()) {
      return response.status(400).json({ message: 'Complete all board room booking fields with valid values.' })
    }
    if (date.getUTCDay() === 0 || date.getUTCDay() === 6 || date < new Date(new Date().toISOString().slice(0, 10))) {
      return response.status(400).json({ message: 'Board room bookings are only available for future weekdays.' })
    }

    const conflict = await prisma.boardRoomBooking.findFirst({
      where: { date, startTime: String(startTime), status: { in: ['PENDING', 'APPROVED'] } },
    })
    if (conflict) return response.status(409).json({ message: 'That date and time is already requested.' })

    const booking = await prisma.boardRoomBooking.create({
      data: {
        name: String(name).trim(),
        department: String(department).trim(),
        date,
        startTime: String(startTime),
        attendees: attendeeCount,
        purpose: String(purpose).trim(),
      },
    })
    await recordActivity(request, {
      action: 'BOARD_ROOM_BOOKING_CREATED',
      entityType: 'BoardRoomBooking',
      entityId: booking.id,
      details: { date: dateValue, startTime, department: booking.department },
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
      select: { date: true, startTime: true, status: true },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    })
    return response.json(bookings)
  } catch (error) {
    return next(error)
  }
}

async function listBookings(request, response, next) {
  try {
    const bookings = await prisma.boardRoomBooking.findMany({ orderBy: [{ date: 'asc' }, { startTime: 'asc' }] })
    return response.json(bookings.map(bookingView))
  } catch (error) {
    return next(error)
  }
}

async function updateBookingStatus(request, response, next) {
  try {
    const status = String(request.body.status || '')
    if (!['APPROVED', 'DECLINED', 'CANCELLED'].includes(status)) return response.status(400).json({ message: 'Invalid booking status.' })
    const booking = await prisma.boardRoomBooking.findUnique({ where: { id: request.params.id } })
    if (!booking) return response.status(404).json({ message: 'Board room booking not found.' })
    if (status === 'APPROVED') {
      const conflict = await prisma.boardRoomBooking.findFirst({
        where: { id: { not: booking.id }, date: booking.date, startTime: booking.startTime, status: 'APPROVED' },
      })
      if (conflict) return response.status(409).json({ message: 'Another approved booking already uses that date and time.' })
    }
    const updated = await prisma.boardRoomBooking.update({
      where: { id: booking.id },
      data: { status, reviewedById: request.auth.id, reviewedByName: request.auth.name || request.auth.email, reviewedAt: new Date() },
    })
    await recordActivity(request, { action: `BOARD_ROOM_BOOKING_${status}`, entityType: 'BoardRoomBooking', entityId: updated.id, details: { status } })
    return response.json(updated)
  } catch (error) {
    return next(error)
  }
}

module.exports = { createBooking, listAvailability, listBookings, updateBookingStatus }