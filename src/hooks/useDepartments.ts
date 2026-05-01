import { useEffect, useState } from 'react'
import { subscribeDepartments } from '@/firebase/departments'
import type { Department } from '@/firebase/types'

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setLoading(true)
    const unsub = subscribeDepartments(
      (list) => {
        setDepartments(list)
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

  return { departments, loading, error }
}
