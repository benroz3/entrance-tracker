import { useEffect, useState } from 'react'
import type { LogEntry } from '@/firebase/types'
import {
  hasActiveAdminSearch,
  parseAdminSearch,
  rowMatchesAdminSearch,
} from '@/utils/adminSearch'

export function useAdminFilteredLogs(items: LogEntry[], searchRaw: string) {
  const [filtered, setFiltered] = useState<LogEntry[]>(items)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    const tokens = parseAdminSearch(searchRaw)

    if (!hasActiveAdminSearch(tokens)) {
      setFiltered(items)
      setPending(false)
      return
    }

    let cancelled = false
    setPending(true)

    ;(async () => {
      const matches = await Promise.all(
        items.map(async (row) =>
          (await rowMatchesAdminSearch(row, tokens)) ? row : null
        )
      )
      const next = matches.filter((x): x is LogEntry => x !== null)
      if (!cancelled) {
        setFiltered(next)
        setPending(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [items, searchRaw])

  return { filteredLogs: filtered, searchPending: pending }
}
