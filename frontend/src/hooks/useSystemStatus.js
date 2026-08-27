import { useEffect, useState } from 'react'
import { apiUrl } from '../api/config'

function useSystemStatus() {
  const [isOnline, setIsOnline] = useState(false)
  const [databaseStatus, setDatabaseStatus] = useState('Checking')

  useEffect(() => {
    let isMounted = true

    async function checkHealth() {
      const controller = new AbortController()
      const timeout = window.setTimeout(() => controller.abort(), 5000)

      try {
        const response = await fetch(`${apiUrl}/api/health`, {
          signal: controller.signal,
          cache: 'no-store',
        })
        const result = await response.json()

        if (isMounted) {
          setIsOnline(response.ok)
          setDatabaseStatus(result.database === 'ok' ? 'Connected' : 'Offline')
        }
      } catch {
        if (isMounted) {
          setIsOnline(false)
          setDatabaseStatus('Offline')
        }
      } finally {
        window.clearTimeout(timeout)
      }
    }

    checkHealth()
    const interval = window.setInterval(checkHealth, 10000)
    window.addEventListener('online', checkHealth)
    window.addEventListener('offline', checkHealth)

    return () => {
      isMounted = false
      window.clearInterval(interval)
      window.removeEventListener('online', checkHealth)
      window.removeEventListener('offline', checkHealth)
    }
  }, [])

  return { isOnline, databaseStatus }
}

export default useSystemStatus
