const { spawn } = require('child_process')
const { getDatabaseConnectionString, getPostgresTool } = require('../../utils/postgresTools')

const maxBackupSize = 512 * 1024 * 1024

function restoreDatabaseBackup(request, response) {
  if (!request.is('application/sql')) {
    return response.status(415).json({ message: 'Upload a PostgreSQL .sql backup file.' })
  }

  if (Number(request.headers['content-length']) > maxBackupSize) {
    return response.status(413).json({ message: 'Backup files must be smaller than 512 MB.' })
  }

  const child = spawn(getPostgresTool('psql'), [
    '--dbname', getDatabaseConnectionString(),
    '--set=ON_ERROR_STOP=1',
    '--single-transaction',
  ], { windowsHide: true, stdio: ['pipe', 'ignore', 'pipe'] })
  let stderr = ''
  let size = 0
  let isTooLarge = false
  let isFinished = false

  child.stderr.on('data', (chunk) => {
    stderr = `${stderr}${chunk}`.slice(-16000)
  })
  child.stdin.on('error', () => {})
  request.on('data', (chunk) => {
    size += chunk.length
    if (size > maxBackupSize && !isTooLarge) {
      isTooLarge = true
      child.kill()
    }
  })
  request.on('aborted', () => child.kill())
  request.on('error', () => child.kill())
  request.pipe(child.stdin)

  child.on('error', (error) => {
    if (isFinished || request.aborted) return
    isFinished = true
    console.error('Unable to import database backup:', error.message)
    return response.status(503).json({ message: 'Database import failed. Ensure PostgreSQL command-line tools are installed.' })
  })
  child.on('close', (code) => {
    if (isFinished || request.aborted) return
    isFinished = true

    if (isTooLarge) {
      return response.status(413).json({ message: 'Backup files must be smaller than 512 MB.' })
    }
    if (!size) {
      return response.status(400).json({ message: 'The selected backup file is empty.' })
    }
    if (code !== 0) {
      console.error('Unable to import database backup:', stderr || `psql exited with code ${code}`)
      return response.status(400).json({ message: 'Import failed. Check that this is a valid backup and the destination database is empty.' })
    }

    return response.json({ message: 'Database import completed.' })
  })
}

module.exports = restoreDatabaseBackup