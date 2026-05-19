import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const TIMEOUT_MS = 30 * 60 * 1000

export function useInactivity() {
  const navigate = useNavigate()
  const timer = useRef(null)

  const reset = () => {
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      await api.post('/logout').catch(() => {})
      localStorage.clear()
      navigate('/login', { state: { reason: 'inactivity' } })
    }, TIMEOUT_MS)
  }

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    events.forEach((e) => window.addEventListener(e, reset))
    reset()
    return () => {
      events.forEach((e) => window.removeEventListener(e, reset))
      clearTimeout(timer.current)
    }
  }, [])
}