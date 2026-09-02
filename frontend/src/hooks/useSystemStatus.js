import { useEffect, useState } from 'react'
import { api } from '../api/config'

function useSystemStatus() {
  const [isOnline, setIsOnline] = useState(false)
  const [databaseStatus, setDatabaseStatus] = useState('Checking')

  useEffect(() => {
    let isMounted = true
    let debounceTimer = null
    let isChecking = false

    async function checkHealth() {
      if (!isMounted || isChecking) {
        return
      }

      isChecking = true
      const controller = new AbortController()
      const timeout = window.setTimeout(() => controller.abort(), 5000)

      try {
        const { data } = await api.get('/api/health', {
          signal: controller.signal,
        })

        if (isMounted) {
          setIsOnline(data?.database === 'ok')
          setDatabaseStatus(data?.database === 'ok' ? 'Connected' : 'Offline')
        }
      } catch {
        if (isMounted) {
          setIsOnline(false)
          setDatabaseStatus('Offline')
        }
      } finally {
        isChecking = false
        window.clearTimeout(timeout)
      }
    }

    function scheduleHealthCheck() {
      if (debounceTimer) {
        window.clearTimeout(debounceTimer)
      }

      debounceTimer = window.setTimeout(() => {
        checkHealth()
      }, 3000)
    }

    scheduleHealthCheck()
    const interval = window.setInterval(scheduleHealthCheck, 10000)
    window.addEventListener('online', scheduleHealthCheck)
    window.addEventListener('offline', scheduleHealthCheck)

    return () => {
      isMounted = false
      if (debounceTimer) {
        window.clearTimeout(debounceTimer)
      }
      window.clearInterval(interval)
      window.removeEventListener('online', scheduleHealthCheck)
      window.removeEventListener('offline', scheduleHealthCheck)
    }
  }, [])

  return { isOnline, databaseStatus }
}

export default useSystemStatus
