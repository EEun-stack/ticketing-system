import { useState } from 'react'
import { api } from '../api/config'

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
      const { data } = await api.post('/api/auth/login', {
        email: formData.get('email'),
        password: formData.get('password'),
      })

      setMessage('Login successful.')
      setUser(data.user)
      onLoginSuccess?.(data.user)
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || 'Unable to connect to the server.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return { handleSubmit, isSubmitting, message, user }
}

export default useLoginAuth
