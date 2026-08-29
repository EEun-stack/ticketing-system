const allowedStatuses = ['NEW', 'PENDING', 'FOR_APPROVAL', 'IN_PROGRESS', 'RESOLVED']

function getDateValue(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function buildRequestWhere(query) {
  const where = {}
  const and = []
  const fromDate = getDateValue(query.dateFrom)
  const toDate = getDateValue(query.dateTo)

  if (fromDate || toDate) {
    where.createdAt = {}
    if (fromDate) where.createdAt.gte = fromDate
    if (toDate) {
      const endDate = new Date(toDate)
      endDate.setDate(endDate.getDate() + 1)
      where.createdAt.lt = endDate
    }
  }

  if (String(query.unit || '').trim()) {
    where.department = String(query.unit).trim()
  }

  if (allowedStatuses.includes(query.status)) {
    where.status = query.status
  }

  if (String(query.requestType || '').trim()) {
    where.requestType = String(query.requestType).trim()
  }

  if (String(query.name || '').trim()) {
    and.push({
      employeeName: {
        contains: String(query.name).trim(),
        mode: 'insensitive',
      },
    })
  }

  if (and.length) where.AND = and
  return where
}

module.exports = { allowedStatuses, buildRequestWhere }