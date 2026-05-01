import { useEffect, useState } from 'react'
import type { Entry } from '@/firebase/types'
import {
  hasActiveAdminSearch,
  parseAdminSearch,
  rowMatchesAdminSearch,
} from '@/utils/adminSearch'

export function useAdminFilteredEntries(entries: Entry[], searchRaw: string) {
  const [filtered, setFiltered] = useState<Entry[]>(entries)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    const tokens = parseAdminSearch(searchRaw)

    if (!hasActiveAdminSearch(tokens)) {
      setFiltered(entries)
      setPending(false)
      return
    }

    let cancelled = false
    setPending(true)

    ;(async () => {
      const matches = await Promise.all(
        entries.map(async (e) =>
          (await rowMatchesAdminSearch(e, tokens)) ? e : null
        )
      )
      const next = matches.filter((x): x is Entry => x !== null)
      if (!cancelled) {
        setFiltered(next)
        setPending(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [entries, searchRaw])

  return { filteredEntries: filtered, searchPending: pending }
}
