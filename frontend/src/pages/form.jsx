import { useEffect, useMemo, useRef, useState } from 'react'
import { FaEye, FaStar } from 'react-icons/fa6'
import { api } from '../api/config'
import ftiLogo from '../assets/fti_logo.png'
import GuestAccountMenu from '../components/guestAccountMenu'
import '../styles/form.css'

const fallbackSettings = {
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

const draftStorageKey = 'guestRequestDraft'
const submittedRequestStorageKey = 'guestSubmittedRequest'
const requestStatusLabels = {
  NEW: 'Waiting for IT staff to claim this ticket',
  PENDING: 'Pending',
  FOR_APPROVAL: 'Waiting for approval',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
}

const boardRoomStatusLabels = {
  PENDING: 'Pending review',
  APPROVED: 'Approved',
  DECLINED: 'Declined',
  CANCELLED: 'Cancelled',
}

const boardRoomTimes = Array.from({ length: 10 }, (_, index) =>
  `${String(index + 8).padStart(2, '0')}:00`,
)

function getDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function timesOverlap(startTime, endTime, booking) {
  const bookingEndTime = booking.endTime || '17:00'
  return startTime < bookingEndTime && booking.startTime < endTime
}

function formatBoardRoomTime(time) {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours < 12 ? 'AM' : 'PM'
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${period}`
}

const boardRoomHolidays = {
  '01-01': "New Year's Day",
  '05-01': 'Labor Day',
  '06-12': 'Independence Day',
  '11-01': "All Saints' Day",
  '12-25': 'Christmas Day',
  '12-30': 'Rizal Day',
}

function getBoardRoomHolidayName(date) {
  return boardRoomHolidays[`${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`]
}

function getBoardRoomDayState(date, bookedDates = {}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const holidayName = getBoardRoomHolidayName(date)
  const dayBookings = bookedDates[getDateKey(date)] || []
  const booked = dayBookings.filter((booking) => ['PENDING', 'APPROVED'].includes(booking.status))
  const availableStartTimes = boardRoomTimes.slice(0, -1).filter((startTime, index) =>
    !booked.some((booking) => timesOverlap(startTime, boardRoomTimes[index + 1], booking)),
  )
  const hasPending = booked.some((booking) => booking.status === 'PENDING')
  const isWeekend = date.getDay() === 0 || date.getDay() === 6
  const isPast = date < today

  return {
    booked,
    availableStartTimes,
    hasPending,
    holidayName,
    isWeekend,
    isPast,
    isAvailable: date >= today && !isWeekend && !holidayName && availableStartTimes.length > 0,
  }
}

function getFirstAvailableBoardRoomRange(date, bookedDates) {
  const { availableStartTimes } = getBoardRoomDayState(date, bookedDates)
  const startTime = availableStartTimes[0]
  if (!startTime) return null
  return {
    startTime,
    endTime: boardRoomTimes[boardRoomTimes.indexOf(startTime) + 1],
  }
}

function readStoredValue(key, fallback) {
  try {
    const storedValue = localStorage.getItem(key)
    return storedValue ? JSON.parse(storedValue) : fallback
  } catch {
    return fallback
  }
}

function scopedStorageKey(key, employeeId) {
  return `${key}:${employeeId || 'anonymous'}`
}

function normalizeSettings(value) {
  const nextSettings = value && typeof value === 'object' ? value : {}

  return {
    ...fallbackSettings,
    ...nextSettings,
    units: Array.isArray(nextSettings.units) && nextSettings.units.length ? nextSettings.units : fallbackSettings.units,
    requestTypes: Array.isArray(nextSettings.requestTypes) && nextSettings.requestTypes.length ? nextSettings.requestTypes : fallbackSettings.requestTypes,
    requestTypeOptions:
      nextSettings.requestTypeOptions && typeof nextSettings.requestTypeOptions === 'object'
        ? nextSettings.requestTypeOptions
        : fallbackSettings.requestTypeOptions,
  }
}

function debounce(callback, delay) {
  let timeoutId = null

  const debouncedCallback = (...args) => {
    if (timeoutId) return

    timeoutId = setTimeout(() => {
      timeoutId = null
      callback(...args)
    }, delay)
  }

  debouncedCallback.cancel = () => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = null
  }

  return debouncedCallback
}

function GuestRequestForm({ employeeId, initialForm = 'ticket', onActivityLogs, onHome, onLogout, onThemeToggle, theme }) {
  const today = new Date()
  const draftKey = scopedStorageKey(draftStorageKey, employeeId)
  const submittedRequestKey = scopedStorageKey(submittedRequestStorageKey, employeeId)
  const employeeNameKey = scopedStorageKey('guestRequestName', employeeId)
  const departmentKey = scopedStorageKey('guestRequestDepartment', employeeId)
  const [selectedForm, setSelectedForm] = useState(initialForm)
  const [submittedRequest, setSubmittedRequest] = useState(() => readStoredValue(submittedRequestKey, null))
  const [settings, setSettings] = useState(fallbackSettings)
  const [selectedRequestType, setSelectedRequestType] = useState(() => readStoredValue(draftKey, {}).requestType || '')
  const [selectedRequestSubType, setSelectedRequestSubType] = useState(() => readStoredValue(draftKey, {}).requestSubType || '')
  const [otherRequestSubType, setOtherRequestSubType] = useState(() => readStoredValue(draftKey, {}).otherRequestSubType || '')
  const [requestStatus, setRequestStatus] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [feedbackRating, setFeedbackRating] = useState(0)
  const [feedbackError, setFeedbackError] = useState('')
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)
  const [employeeName] = useState(() => {
    try {
      return localStorage.getItem(employeeNameKey) || ''
    } catch {
      return ''
    }
  })
  const [department] = useState(() => {
    try {
      return localStorage.getItem(departmentKey) || ''
    } catch {
      return ''
    }
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [boardRoomConfirmation, setBoardRoomConfirmation] = useState(null)
  const [selectedBoardRoomDate, setSelectedBoardRoomDate] = useState('')
  const [boardRoomStartTime, setBoardRoomStartTime] = useState('08:00')
  const [boardRoomEndTime, setBoardRoomEndTime] = useState('09:00')
  const [selectedBoardRoomPreviewDate, setSelectedBoardRoomPreviewDate] = useState('')
  const [boardRoomMonth, setBoardRoomMonth] = useState(() => new Date())
  const [bookedBoardRoomDates, setBookedBoardRoomDates] = useState({})
  const [boardRoomSubmitting, setBoardRoomSubmitting] = useState(false)
  const [boardRoomError, setBoardRoomError] = useState('')
  const submitLockRef = useRef(false)
  const boardRoomSubmitLockRef = useRef(false)
  const debouncedSubmitRef = useRef(null)
  const debouncedBoardRoomSubmitRef = useRef(null)
  const submitted = Boolean(submittedRequest)

  const guestDateLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(today)
  const compactGuestDateLabel = new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  }).format(today)

  useEffect(() => {
    const month = `${boardRoomMonth.getFullYear()}-${String(boardRoomMonth.getMonth() + 1).padStart(2, '0')}`
    api.get(`/api/requests/board-room/availability?month=${month}`)
      .then(({ data }) => setBookedBoardRoomDates(data.reduce((dates, booking) => {
        const dateKey = String(booking.date).slice(0, 10)
        if (!dates[dateKey]) dates[dateKey] = []
        dates[dateKey].push(booking)
        return dates
      }, {})))
      .catch(() => setBookedBoardRoomDates({}))
  }, [boardRoomMonth])

  const boardRoomCalendarDays = useMemo(() => {
    const year = boardRoomMonth.getFullYear()
    const month = boardRoomMonth.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = []

    for (let day = 1; day <= daysInMonth; day += 1) {
      days.push(new Date(year, month, day))
    }

    return days
  }, [boardRoomMonth])

  const selectedBoardRoomPreview = useMemo(() => {
    if (!selectedBoardRoomPreviewDate) return null
    const date = boardRoomCalendarDays.find((day) => getDateKey(day) === selectedBoardRoomPreviewDate)
    if (!date) return null
    return { date, ...getBoardRoomDayState(date, bookedBoardRoomDates) }
  }, [boardRoomCalendarDays, bookedBoardRoomDates, selectedBoardRoomPreviewDate])

  const selectedBoardRoomDayState = selectedBoardRoomDate
    ? getBoardRoomDayState(new Date(`${selectedBoardRoomDate}T00:00:00`), bookedBoardRoomDates)
    : null

  const boardRoomConflict = useMemo(() => {
    if (!selectedBoardRoomDate || boardRoomEndTime <= boardRoomStartTime) return null
    return (bookedBoardRoomDates[selectedBoardRoomDate] || [])
      .find((booking) => ['PENDING', 'APPROVED'].includes(booking.status)
        && timesOverlap(boardRoomStartTime, boardRoomEndTime, booking)) || null
  }, [boardRoomEndTime, boardRoomStartTime, bookedBoardRoomDates, selectedBoardRoomDate])

  useEffect(() => {
    if (!submittedRequest?.id) return undefined

    let isCancelled = false
    let interval
    const loadStatus = async () => {
      try {
        const { data } = await api.get(`/api/requests/${submittedRequest.id}`)
        if (isCancelled) return

        setRequestStatus(data)
        if (data.status === 'RESOLVED') {
          window.clearInterval(interval)
        }
      } catch (error) {
        if (!isCancelled && error.response?.status === 404) {
          setSubmittedRequest(null)
          localStorage.removeItem(submittedRequestKey)
        }
      }
    }

    loadStatus()
    interval = window.setInterval(loadStatus, 5000)
    return () => {
      isCancelled = true
      window.clearInterval(interval)
    }
  }, [submittedRequest?.id, submittedRequestKey])

  useEffect(() => {
    if (submitted) return

    try {
      localStorage.setItem(draftKey, JSON.stringify({
        employeeName,
        department,
        requestType: selectedRequestType,
        requestSubType: selectedRequestSubType,
        otherRequestSubType,
      }))
    } catch {
      // Ignore storage errors for private browsing or restricted environments.
    }
  }, [department, draftKey, employeeName, otherRequestSubType, selectedRequestSubType, selectedRequestType, submitted])

  useEffect(() => {
    api.get(`/api/requests/settings?updated=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache' },
    })
      .then(({ data }) => {
        const normalizedSettings = normalizeSettings(data)
        setSettings(normalizedSettings)
      })
      .catch(() => {
        setSettings(fallbackSettings)
        setBoardRoomUnits(fallbackSettings.units)
      })
  }, [submittedRequestKey])

  useEffect(() => {
    if (!boardRoomConfirmation?.id) return undefined

    let isCancelled = false
    const loadBookingStatus = async () => {
      try {
        const { data } = await api.get(`/api/requests/board-room/${boardRoomConfirmation.id}`)
        if (!isCancelled) setBoardRoomConfirmation((current) => ({ ...current, ...data }))
      } catch {
        // Keep the submitted confirmation visible if a status refresh fails.
      }
    }

    loadBookingStatus()
    const interval = window.setInterval(loadBookingStatus, 5000)
    return () => {
      isCancelled = true
      window.clearInterval(interval)
    }
  }, [boardRoomConfirmation?.id])

  useEffect(() => {
    const submitRequest = async (values, formElement) => {
      try {
        const { data } = await api.post('/api/requests', values)
        setSubmittedRequest(data)
        setRequestStatus(data)
        localStorage.setItem(submittedRequestKey, JSON.stringify(data))
        localStorage.removeItem(draftKey)
        setSelectedRequestType('')
        setSelectedRequestSubType('')
        setOtherRequestSubType('')
        formElement.reset()
      } catch (error) {
        setErrorMessage(error.response?.data?.message || error.message || 'Unable to submit request.')
      } finally {
        submitLockRef.current = false
        setIsSubmitting(false)
      }
    }

    const debouncedSubmit = debounce(submitRequest, 400)
    debouncedSubmitRef.current = debouncedSubmit

    return () => debouncedSubmit.cancel()
  }, [draftKey, submittedRequestKey])

  useEffect(() => {
    const debouncedBoardRoomSubmit = debounce(async (values) => {
      try {
        const { data } = await api.post('/api/requests/board-room', values)
        setBoardRoomConfirmation(data)
        setSelectedBoardRoomDate('')
      } catch (error) {
        setBoardRoomError(error.response?.data?.message || error.message || 'Unable to submit board room request.')
      } finally {
        boardRoomSubmitLockRef.current = false
        setBoardRoomSubmitting(false)
      }
    }, 400)

    debouncedBoardRoomSubmitRef.current = debouncedBoardRoomSubmit
    return () => debouncedBoardRoomSubmit.cancel()
  }, [])

  function handleSubmit(event) {
    event.preventDefault()

    if (submitLockRef.current) return

    submitLockRef.current = true
    setIsSubmitting(true)
    setErrorMessage('')

    const formElement = event.currentTarget
    const formData = new FormData(formElement)
    const values = { ...Object.fromEntries(formData.entries()), employeeId }
    delete values.otherRequestType

    debouncedSubmitRef.current(values, formElement)
  }

  async function handleBoardRoomSubmit(event) {
    event.preventDefault()
    if (boardRoomSubmitLockRef.current) return

    if (boardRoomConflict) {
      setBoardRoomError(`This time is already reserved from ${formatBoardRoomTime(boardRoomConflict.startTime)}${boardRoomConflict.endTime ? ` to ${formatBoardRoomTime(boardRoomConflict.endTime)}` : ''}. Choose another time or date.`)
      return
    }

    boardRoomSubmitLockRef.current = true
    const values = { ...Object.fromEntries(new FormData(event.currentTarget).entries()), employeeId }
    values.startTime = boardRoomStartTime
    values.endTime = boardRoomEndTime
    setBoardRoomSubmitting(true)
    setBoardRoomError('')
    debouncedBoardRoomSubmitRef.current(values)
  }

  async function handleFeedbackSubmit(event) {
    event.preventDefault()
    setIsSubmittingFeedback(true)
    setFeedbackError('')

    try {
      const { data } = await api.post(`/api/requests/${submittedRequest.id}/feedback`, { feedback, rating: feedbackRating })
      setRequestStatus((current) => ({ ...current, ...data }))
      setFeedback('')
      setFeedbackRating(0)
    } catch (error) {
      setFeedbackError(error.response?.data?.message || error.message || 'Unable to submit feedback.')
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

  function addFeedbackPhrase(phrase) {
    setFeedback((current) => {
      const trimmedFeedback = current.trim()
      if (trimmedFeedback.toLowerCase().includes(phrase.toLowerCase())) return current

      const separator = trimmedFeedback
        ? `${/[.!?]$/.test(trimmedFeedback) ? '' : '.'} `
        : ''
      return `${trimmedFeedback}${separator}${phrase}.`
    })
  }

  return (
    <main className="request-page">
      <div className="guest-topbar">
        <img className="guest-logo" src={ftiLogo} alt="FTI" />
        <time className="guest-date">
          <span className="guest-date-full">{guestDateLabel}</span>
          <span className="guest-date-compact">{compactGuestDateLabel}</span>
        </time>
        <div className="guest-actions">
          <button className="guest-home-link" type="button" onClick={onHome}>
            My requests
          </button>
          <button
            className="guest-icon-button"
            type="button"
            onClick={onThemeToggle}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <FaEye aria-hidden="true" /> : <FaEye aria-hidden="true" />}
          </button>
          <GuestAccountMenu
            employeeName={employeeName || 'Employee'}
            unit={department}
            onActivityLogs={onActivityLogs}
            onLogout={onLogout}
          />
        </div>
      </div>
      <section className="request-card">
        <header className="request-header">
          <p className="request-label">Employee services</p>
          <h1>{selectedForm === 'board-room' ? 'Board Room Booking' : settings.title}</h1>
          <p>
            {selectedForm === 'board-room'
              ? 'Choose an available date and time to book the board room.'
              : settings.description}
          </p>
        </header>

        <div className="form-selector" role="tablist" aria-label="Choose a form">
          <button
            className={selectedForm === 'ticket' ? 'active' : ''}
            type="button"
            role="tab"
            aria-selected={selectedForm === 'ticket'}
            onClick={() => setSelectedForm('ticket')}
          >
            Request ticket form
          </button>
          <button
            className={selectedForm === 'board-room' ? 'active' : ''}
            type="button"
            role="tab"
            aria-selected={selectedForm === 'board-room'}
            onClick={() => setSelectedForm('board-room')}
          >
            Board room
          </button>
        </div>

        {selectedForm === 'board-room' ? (
          boardRoomConfirmation ? (
            <div className="request-success" role="status">
              <h2>Board ro  om request received</h2>
              <p>
                {new Date(boardRoomConfirmation.date).toLocaleDateString()} from {formatBoardRoomTime(boardRoomConfirmation.startTime)}
                {boardRoomConfirmation.endTime
                  ? ` to ${formatBoardRoomTime(boardRoomConfirmation.endTime)}`
                  : ''}
                .
              </p>
              <strong className={`request-status-label board-room-status ${boardRoomConfirmation.status?.toLowerCase()}`}>
                {boardRoomStatusLabels[boardRoomConfirmation.status] || 'Pending review'}
              </strong>
              <p>
                {boardRoomConfirmation.status === 'APPROVED'
                  ? `Approved${boardRoomConfirmation.reviewedByName ? ` by ${boardRoomConfirmation.reviewedByName}` : ''}.`
                  : boardRoomConfirmation.status === 'DECLINED'
                    ? `Declined${boardRoomConfirmation.reviewedByName ? ` by ${boardRoomConfirmation.reviewedByName}` : ''}.`
                    : boardRoomConfirmation.status === 'CANCELLED'
                      ? 'This booking was cancelled.'
                      : 'We will confirm the room availability with you shortly.'}
              </p>
              {boardRoomConfirmation.reviewedAt && <p>Updated {new Date(boardRoomConfirmation.reviewedAt).toLocaleString()}.</p>}
              <button type="button" onClick={() => setBoardRoomConfirmation(null)}>Make another booking</button>
            </div>
          ) : (
            <form key="board-room-form" className="support-form" onSubmit={handleBoardRoomSubmit}>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="board-room-name">Employee Name</label>
                  <input
                    id="board-room-name"
                    name="name"
                    type="text"
                    value={employeeName}
                    readOnly
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="board-room-department">Department / Office</label>
                  <input
                    id="board-room-department"
                    name="department"
                    type="text"
                    value={department}
                    readOnly
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="board-room-date">Date</label>
                  <input
                    id="board-room-date"
                    name="date"
                    type="date"
                    min={getDateKey(new Date())}
                    value={selectedBoardRoomDate}
                    onChange={(event) => {
                      const dateValue = event.target.value
                      if (!dateValue) {
                        setSelectedBoardRoomDate('')
                        setBoardRoomError('')
                        return
                      }
                      const date = new Date(`${dateValue}T00:00:00`)
                      const dayState = getBoardRoomDayState(date, bookedBoardRoomDates)
                      if (dayState.isPast || dayState.isWeekend) {
                        setBoardRoomError('Choose a future weekday for your booking.')
                        return
                      }
                      setSelectedBoardRoomDate(dateValue)
                      const availableRange = getFirstAvailableBoardRoomRange(date, bookedBoardRoomDates)
                      if (availableRange) {
                        setBoardRoomStartTime(availableRange.startTime)
                        setBoardRoomEndTime(availableRange.endTime)
                        setBoardRoomError('')
                      } else {
                        setBoardRoomError('No available times remain on this date. Choose another date.')
                      }
                    }}
                    onClick={(event) => event.currentTarget.showPicker?.()}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="board-room-start-time">Start time</label>
                  <select
                    id="board-room-start-time"
                    value={boardRoomStartTime}
                    onChange={(event) => {
                      const nextStartTime = event.target.value
                      setBoardRoomStartTime(nextStartTime)
                      if (boardRoomEndTime <= nextStartTime) {
                        const nextTimeIndex = boardRoomTimes.indexOf(nextStartTime) + 1
                        setBoardRoomEndTime(boardRoomTimes[nextTimeIndex])
                      }
                      setBoardRoomError('')
                    }}
                    required
                  >
                    {boardRoomTimes.slice(0, -1).map((time) => {
                      const available = !selectedBoardRoomDayState
                        || selectedBoardRoomDayState.availableStartTimes.includes(time)
                      return (
                        <option key={time} value={time} disabled={!available}>
                          {formatBoardRoomTime(time)}{available ? '' : ' (unavailable)'}
                        </option>
                      )
                    })}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="board-room-end-time">End time</label>
                  <select
                    id="board-room-end-time"
                    value={boardRoomEndTime}
                    onChange={(event) => {
                      setBoardRoomEndTime(event.target.value)
                      setBoardRoomError('')
                    }}
                    required
                  >
                    {boardRoomTimes.filter((time) => time > boardRoomStartTime).map((time) => {
                      const hasConflict = Boolean(selectedBoardRoomDate
                        && (bookedBoardRoomDates[selectedBoardRoomDate] || []).some((booking) =>
                          ['PENDING', 'APPROVED'].includes(booking.status)
                            && timesOverlap(boardRoomStartTime, time, booking),
                        ))
                      return (
                        <option key={time} value={time} disabled={hasConflict}>
                          {formatBoardRoomTime(time)}{hasConflict ? ' (unavailable)' : ''}
                        </option>
                      )
                    })}
                  </select>
                </div>
                {boardRoomConflict && (
                  <p className="board-room-conflict full-width" role="alert">
                    This time is already reserved from {formatBoardRoomTime(boardRoomConflict.startTime)}{boardRoomConflict.endTime ? ` to ${formatBoardRoomTime(boardRoomConflict.endTime)}` : ''}. Choose another time or date.
                  </p>
                )}
                <div className="board-room-preview full-width" aria-label="Available board room days">
                  <div className="board-room-preview-heading">
                    <div>
                      <span className="form-field-label">Calendar preview</span>
                      <p>Choose an available weekday for your booking.</p>
                    </div>
                    <div className="board-room-month-controls">
                      <button type="button" onClick={() => setBoardRoomMonth((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1))} aria-label="Previous month">&lsaquo;</button>
                      <strong>{boardRoomMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</strong>
                      <button type="button" onClick={() => setBoardRoomMonth((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1))} aria-label="Next month">&rsaquo;</button>
                    </div>
                  </div>
                  <div className="board-room-weekdays" aria-hidden="true">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day}>{day}</span>)}
                  </div>
                  <div className="board-room-calendar-grid">
                    {boardRoomCalendarDays.map((date) => {
                      const dateKey = getDateKey(date)
                      const dayState = getBoardRoomDayState(date, bookedBoardRoomDates)
                      const isAvailable = dayState.isAvailable
                      const isSelected = selectedBoardRoomDate === dateKey
                      const bookingSummary = dayState.booked.length > 0
                        ? `Reserved: ${dayState.booked.map((booking) => `${booking.startTime}${booking.endTime ? ` - ${booking.endTime}` : ''}`).join(', ')}`
                        : null
                      const unavailableReason = bookingSummary
                        || (dayState.hasPending ? 'Pending approval - unavailable' : null)
                        || dayState.holidayName
                        || (dayState.isWeekend ? 'Weekend' : dayState.isPast ? 'Past date' : 'Unavailable')
                      const tooltip = isAvailable ? 'Available for booking' : unavailableReason
                      return (
                        <button
                          className={`board-room-calendar-day ${dayState.booked.length > 0 || dayState.hasPending ? 'occupied' : ''} ${dayState.booked.length === 0 && !dayState.hasPending && (dayState.holidayName || dayState.isWeekend) ? 'holiday' : ''} ${isAvailable ? 'available' : 'unavailable'} ${isSelected ? 'selected' : ''} ${selectedBoardRoomPreviewDate === dateKey ? 'preview-selected' : ''}`}
                          key={dateKey}
                          type="button"
                          style={date.getDate() === 1 ? { gridColumnStart: date.getDay() + 1 } : undefined}
                          disabled={!isAvailable}
                          onClick={() => {
                            setSelectedBoardRoomPreviewDate(dateKey)
                            if (isAvailable) {
                              setSelectedBoardRoomDate(dateKey)
                              setBoardRoomSlot((currentSlot) => getAvailableBoardRoomSlot(date, bookedBoardRoomDates, currentSlot))
                            }
                          }}
                          aria-label={`${date.toLocaleDateString('en-US', { dateStyle: 'full' })}, ${tooltip}`}
                        >
                          <span className="board-room-calendar-date">{date.getDate()}</span>
                          {dayState.booked.length > 0 && (
                            <span className="board-room-calendar-events">
                              {dayState.booked.map((booking) => (
                                <span className="board-room-calendar-event" key={`${dateKey}-${booking.startTime}`}>
                                  <strong>{formatBoardRoomTime(booking.startTime)}{booking.endTime ? ` - ${formatBoardRoomTime(booking.endTime)}` : ''}</strong>
                                </span>
                              ))}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  {selectedBoardRoomPreview && (
                    <div className={`board-room-day-details ${selectedBoardRoomPreview.isAvailable ? 'available' : 'unavailable'}`} role="status">
                      <strong>{selectedBoardRoomPreview.date.toLocaleDateString('en-US', { dateStyle: 'full' })}</strong>
                      {selectedBoardRoomPreview.holidayName ? (
                        <span>{selectedBoardRoomPreview.holidayName} - unavailable</span>
                      ) : selectedBoardRoomPreview.isWeekend ? (
                        <span>Weekend - unavailable</span>
                      ) : selectedBoardRoomPreview.isPast ? (
                        <span>Past date - unavailable</span>
                      ) : (
                        <>
                          <span>
                            Available start times: {selectedBoardRoomPreview.availableStartTimes.length
                              ? selectedBoardRoomPreview.availableStartTimes.map(formatBoardRoomTime).join(', ')
                              : 'None'}
                          </span>
                          {selectedBoardRoomPreview.booked.map((booking) => (
                            <span key={`${booking.startTime}-${booking.status}`}>
                              {formatBoardRoomTime(booking.startTime)}{booking.endTime ? ` - ${formatBoardRoomTime(booking.endTime)}` : ''} ({booking.status.toLowerCase()})
                            </span>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                  <div className="board-room-calendar-legend">
                    <span><i className="available-dot" />Available</span>
                    <span><i className="occupied-dot" />Occupied</span>
                    <span><i className="holiday-dot" />Weekend / holiday</span>
                  </div>
                </div>
                <div className="form-field full-width">
                  <label htmlFor="board-room-purpose">Meeting purpose</label>
                  <textarea id="board-room-purpose" name="purpose" rows="4" placeholder="What is the room needed for?" required />
                </div>
              </div>
              {boardRoomError && <p className="form-error" role="alert">{boardRoomError}</p>}
              <button className="submit-request" type="submit" disabled={boardRoomSubmitting || Boolean(boardRoomConflict)}>
                {boardRoomSubmitting ? 'Sending request...' : 'Request board room'}
              </button>
            </form>
          )
        ) : submitted ? (
          <div className="request-success" role="status">
            <h2>{requestStatus?.claimedByName ? 'Your ticket is being handled' : 'Waiting for Available IT staff'}</h2>
            <p>
              Control ID: <strong>{submittedRequest?.controlId || requestStatus?.controlId || '—'}</strong>
            </p>
            <p>
              {requestStatus?.claimedByName
                ? `Accepted by ${requestStatus.claimedByName}.`
                : 'Your ticket was submitted.'}
            </p>
            {!requestStatus?.claimedByName && (
              <strong className="request-status-label">
                Waiting for IT staff to claim this ticket
              </strong>
            )}
            {requestStatus?.claimedByName && requestStatus.status !== 'NEW' && (
              <strong className="request-status-label">
                {requestStatusLabels[requestStatus.status] || 'Ticket in progress'}
              </strong>
            )}
            {requestStatus?.statusUpdatedByName && requestStatus.status !== 'NEW' && (
              <p>Latest update by {requestStatus.statusUpdatedByName}.</p>
            )}
            {requestStatus?.status === 'RESOLVED' && !requestStatus.feedbackSubmittedAt && (
              <form className="request-feedback" onSubmit={handleFeedbackSubmit}>
                <label htmlFor="request-feedback">How was your support experience?</label>
                <fieldset className="feedback-rating">
                  <legend>Rate your experience</legend>
                  <div className="feedback-star-row" role="group" aria-label="Star rating">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        className={`feedback-star ${feedbackRating >= rating ? 'selected' : ''}`}
                        type="button"
                        key={rating}
                        onClick={() => setFeedbackRating(rating)}
                        aria-label={`${rating} star${rating === 1 ? '' : 's'}`}
                        aria-pressed={feedbackRating === rating}
                      >
                        <FaStar aria-hidden="true" />
                      </button>
                    ))}
                    <span className="feedback-rating-value" aria-live="polite">
                      {feedbackRating ? `${feedbackRating} of 5` : 'Select a rating'}
                    </span>
                  </div>
                </fieldset>
                <div className="feedback-suggestions" aria-label="Quick feedback suggestions">
                  <span className="feedback-suggestions-label">Quick comments (click to add):</span>
                  {[
                    'The support was reliable',
                    'The response was fast',
                    'The issue was resolved quickly',
                    'The staff was friendly and professional',
                    'The instructions were clear',
                    'The support was helpful',
                  ].map((phrase) => (
                    <button
                      className="feedback-suggestion"
                      type="button"
                      key={phrase}
                      onClick={() => addFeedbackPhrase(phrase)}
                    >
                      {phrase}
                    </button>
                  ))}
                </div>
                <textarea
                  id="request-feedback"
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  maxLength="2000"
                  rows="5"
                  required
                />
                {feedbackError && <p className="form-error" role="alert">{feedbackError}</p>}
                <button type="submit" disabled={isSubmittingFeedback || !feedbackRating}>
                  {isSubmittingFeedback ? 'Submitting...' : 'Submit feedback'}
                </button>
              </form>
            )}
            {requestStatus?.feedbackSubmittedAt && (
              <div className="feedback-confirmation">
                <p>Thank you for your feedback.</p>
                {requestStatus.feedbackRating && <p>Your rating: {requestStatus.feedbackRating} of 5 stars</p>}
              </div>
            )}
            {requestStatus?.feedbackSubmittedAt && (
              <button type="button" onClick={() => {
                setSubmittedRequest(null)
                setRequestStatus(null)
                localStorage.removeItem(submittedRequestKey)
              }}>
                Submit another request
              </button>
            )}
          </div>
        ) : (
          <form key="ticket-form" className="support-form" onSubmit={handleSubmit} aria-busy={isSubmitting}>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="employee-name">Employee Name</label>
                <input
                  id="employee-name"
                  name="employeeName"
                  type="text"
                  value={employeeName}
                  readOnly
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="department">Department / Office</label>
                <input
                  id="department"
                  name="department"
                  type="text"
                  value={department}
                  readOnly
                  required
                />
              </div>

              <fieldset className="request-types">
                <legend>Nature</legend>
                <div className="type-options">
                  {settings.requestTypes.map((type) => (
                    <label className="type-option" key={type}>
                      <input
                        type="radio"
                        name="requestType"
                        value={type}
                        checked={selectedRequestType === type}
                        onChange={(event) => {
                          setSelectedRequestType(event.target.value)
                          setSelectedRequestSubType('')
                        }}
                        required
                      />
                      <span>{type}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {selectedRequestType && selectedRequestType !== 'Other' && settings.requestTypeOptions?.[selectedRequestType]?.length > 0 && (
                <fieldset className="request-types nested-request-types">
                  <legend>{selectedRequestType} options</legend>
                  <div className="type-options">
                    {settings.requestTypeOptions[selectedRequestType].map((option) => (
                      <label className="type-option" key={option}>
                        <input
                          type="radio"
                          name="requestSubType"
                          value={option}
                          checked={selectedRequestSubType === option}
                          onChange={(event) => setSelectedRequestSubType(event.target.value)}
                          required
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}

              {selectedRequestType === 'Other' && (
                <div className="form-field">
                  <label htmlFor="other-request-type">Please specify</label>
                  <textarea
                    id="other-request-type"
                    name="requestSubType"
                    rows="6"
                    value={otherRequestSubType}
                    onChange={(event) => setOtherRequestSubType(event.target.value)}
                    required
                  />
                </div>
              )}

            </div>

            {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
            {isSubmitting && (
              <div className="submit-queue-status" role="status" aria-live="polite">
                <div className="submit-queue-heading">
                  <span className="submit-queue-spinner" aria-hidden="true" />
                  <strong>Adding your ticket to the queue</strong>
                </div>
                <p>Please wait while your request is being submitted.</p>
                <div className="submit-queue-progress" aria-hidden="true">
                  <span />
                </div>
              </div>
            )}
            <button className="submit-request" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        )}
      </section>
    </main>
  )
}

export default GuestRequestForm
