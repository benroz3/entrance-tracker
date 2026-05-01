import type { Timestamp } from 'firebase/firestore'

export function formatDateTime(ts: Timestamp): string {
  try {
    return ts.toDate().toLocaleString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return '—'
  }
}
