import { useState } from 'react'
import { saveAuthSession } from '../services/authStorage'

function useLoginAuth(onLoginSuccess) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [user, setUser] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    const formData = new FormData(event.currentTarget)

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.get('email'),
            password: formData.get('password'),
          }),
        },
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Unable to log in.')
      }

      saveAuthSession(result.token, result.user)
      setMessage('Login successful.')
      setUser(result.user)
      onLoginSuccess?.(result.user)
    } catch (error) {
      setMessage(error.message || 'Unable to connect to the server.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return { handleSubmit, isSubmitting, message, user }
}

export default useLoginAuth
