import { useEffect, useState } from 'react'
import { api } from '../api/config'

function useSystemStatus() {
  const [isOnline, setIsOnline] = useState(false)
  const [databaseStatus, setDatabaseStatus] = useState('Checking')

  useEffect(() => {
    let isMounted = true

    async function checkHealth() {
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
