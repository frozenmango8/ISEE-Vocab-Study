import { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { parseSetId } from './sets'

export function useCurrentSet() {
  const { setId } = useParams()
  return parseSetId(setId)
}

export function useProgress() {
  const location = useLocation()
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const bump = () => setTick((n) => n + 1)
    window.addEventListener('isee-progress', bump)
    window.addEventListener('storage', bump)
    window.addEventListener('focus', bump)
    return () => {
      window.removeEventListener('isee-progress', bump)
      window.removeEventListener('storage', bump)
      window.removeEventListener('focus', bump)
    }
  }, [])

  return `${location.key}:${tick}`
}
