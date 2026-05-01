import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from '@/firebase/config'
import { LOGS_PAGE_SIZE } from '@/firebase/logs'
import type { LogDocRead, LogEntry } from '@/firebase/types'

const logsCol = () => collection(db, 'logs')

function mapLogDocs(docs: QueryDocumentSnapshot[]): LogEntry[] {
  return docs.map((d) => ({
    id: d.id,
    ...(d.data() as LogDocRead),
  }))
}

export function useLogs() {
  const [headDocs, setHeadDocs] = useState<QueryDocumentSnapshot[]>([])
  const [headHasMore, setHeadHasMore] = useState(false)
  const [tail, setTail] = useState<{ entries: LogEntry[]; lastDoc: QueryDocumentSnapshot }[]>([])
  const [tailExhausted, setTailExhausted] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [listening, setListening] = useState(true)

  useEffect(() => {
    const q = query(
      logsCol(),
      orderBy('timestamp', 'desc'),
      limit(LOGS_PAGE_SIZE)
    )
    return onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs
        setHeadDocs(docs)
        setHeadHasMore(docs.length === LOGS_PAGE_SIZE)
        setError(null)
        setListening(false)
      },
      (err) => {
        setError(err as Error)
        setListening(false)
      }
    )
  }, [])

  const headEntries = useMemo(() => mapLogDocs(headDocs), [headDocs])

  const items = useMemo(
    () => [...headEntries, ...tail.flatMap((t) => t.entries)],
    [headEntries, tail]
  )

  const lastCursor = useMemo(() => {
    if (tail.length > 0) return tail[tail.length - 1].lastDoc
    if (headDocs.length > 0) return headDocs[headDocs.length - 1]
    return null
  }, [headDocs, tail])

  const canLoadMore = useMemo(() => {
    if (tailExhausted) return false
    if (tail.length > 0) {
      return tail[tail.length - 1].entries.length === LOGS_PAGE_SIZE
    }
    return headHasMore
  }, [headHasMore, tail, tailExhausted])

  const loadMore = useCallback(async () => {
    if (!lastCursor) return
    const q = query(
      logsCol(),
      orderBy('timestamp', 'desc'),
      startAfter(lastCursor),
      limit(LOGS_PAGE_SIZE)
    )
    const snap = await getDocs(q)
    const docs = snap.docs
    if (docs.length === 0) {
      setTailExhausted(true)
      return
    }
    setTail((prev) => [
      ...prev,
      {
        entries: mapLogDocs(docs),
        lastDoc: docs[docs.length - 1],
      },
    ])
    if (docs.length < LOGS_PAGE_SIZE) {
      setTailExhausted(true)
    }
  }, [lastCursor])

  return { items, loadMore, canLoadMore, error, loading: listening }
}
