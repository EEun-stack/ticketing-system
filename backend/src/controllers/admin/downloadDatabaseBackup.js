const { spawn } = require('child_process')
const { getDatabaseConnectionString, getPostgresTool } = require('../../utils/postgresTools')

function downloadDatabaseBackup(request, response) {
  const child = spawn(getPostgresTool('pg_dump'), [
    '--dbname', getDatabaseConnectionString(),
    '--format=plain',
    '--no-owner',
    '--no-privileges',
  ], { windowsHide: true })
  let stderr = ''
  let isFinished = false

  function fail(error) {
    if (isFinished) return
    isFinished = true
    console.error('Unable to create database backup:', error.message)
    if (!response.headersSent) {
      response.status(503).json({ message: 'Database export failed. Ensure PostgreSQL command-line tools and a valid database connection are available.' })
    } else {
      response.destroy(error)
    }
  }

  response.setHeader('Content-Type', 'application/sql')
  response.setHeader('Content-Disposition', `attachment; filename="ticketing-backup-${new Date().toISOString().slice(0, 10)}.sql"`)
  child.stderr.on('data', (chunk) => {
    stderr = `${stderr}${chunk}`.slice(-16000)
  })
  child.stdout.pipe(response)
  child.on('error', fail)
  child.on('close', (code) => {
    if (code !== 0) {
      fail(new Error(stderr || `pg_dump exited with code ${code}`))
    } else {
      isFinished = true
    }
  })
  response.on('close', () => {
    if (!response.writableFinished && !child.killed) child.kill()
  })
}

module.exports = downloadDatabaseBackup