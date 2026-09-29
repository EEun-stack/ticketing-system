const fs = require('fs')
const path = require('path')

const windowsPostgresDirectory = 'C:\\Program Files\\PostgreSQL'

function getPostgresTool(name) {
  if (process.env.PG_BIN_DIR) {
    const executable = path.join(process.env.PG_BIN_DIR, `${name}.exe`)
    if (fs.existsSync(executable)) return executable
  }

  if (process.platform === 'win32' && fs.existsSync(windowsPostgresDirectory)) {
    const versions = fs.readdirSync(windowsPostgresDirectory)
      .sort((left, right) => right.localeCompare(left, undefined, { numeric: true }))
    const executable = versions
      .map((version) => path.join(windowsPostgresDirectory, version, 'bin', `${name}.exe`))
      .find((candidate) => fs.existsSync(candidate))
    if (executable) return executable
  }

  return process.platform === 'win32' ? `${name}.exe` : name
}

function getDatabaseConnectionString() {
  return process.env.DATABASE_URL
    .replace(/([?&])schema=[^&]*&?/, '$1')
    .replace(/[?&]$/, '')
}

module.exports = { getDatabaseConnectionString, getPostgresTool }