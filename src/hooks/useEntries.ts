import { useEffect, useState } from 'react'
import { subscribeEntries } from '@/firebase/entries'
import type { Entry } from '@/firebase/types'

export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setLoading(true)
    const unsub = subscribeEntries(
      (list) => {
        setEntries(list)
        setLoading(false)
        setError(null)
      },
      (e) => {
        setError(e)
        setLoading(false)
      }
    )
    return unsub
  }, [])

  return { entries, loading, error }
}
