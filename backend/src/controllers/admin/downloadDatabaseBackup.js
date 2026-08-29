const { execFile } = require('child_process')
const fs = require('fs')
const path = require('path')

function downloadDatabaseBackup(request, response) {
  const pgDumpCandidates = [
    ...(fs.existsSync('C:\\Program Files\\PostgreSQL')
      ? fs.readdirSync('C:\\Program Files\\PostgreSQL')
        .map((version) => path.join('C:\\Program Files\\PostgreSQL', version, 'bin', 'pg_dump.exe'))
      : []),
    'pg_dump',
  ]
  const pgDump = pgDumpCandidates.find((candidate) => candidate === 'pg_dump' || fs.existsSync(candidate))

  if (!pgDump) {
    return response.status(503).json({ message: 'Database backup is unavailable. Make sure pg_dump is installed.' })
  }

  const databaseUrl = process.env.DATABASE_URL
    .replace(/([?&])schema=[^&]*&?/, '$1')
    .replace(/[?&]$/, '')

  execFile(pgDump, ['--dbname', databaseUrl, '--format=plain'], {
    maxBuffer: 50 * 1024 * 1024,
  }, (error, stdout, stderr) => {
    if (error) {
      console.error('Unable to create database backup:', stderr || error.message)
      return response.status(503).json({ message: 'Database backup is unavailable. Make sure pg_dump is installed.' })
    }

    response.setHeader('Content-Type', 'application/sql')
    response.setHeader('Content-Disposition', `attachment; filename="ticketing-backup-${new Date().toISOString().slice(0, 10)}.sql"`)
    return response.send(stdout)
  })
}

module.exports = downloadDatabaseBackup