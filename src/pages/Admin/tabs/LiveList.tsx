import { useMemo } from 'react'
import { EmployeeIdReveal } from '@/components/EmployeeIdReveal/EmployeeIdReveal'
import type { Entry } from '@/firebase/types'
import { formatDateTime } from '@/utils/formatTime'
import t from '@/i18n/he.json'

type LiveListProps = {
  entries: Entry[]
  loading: boolean
  error: Error | null
}

function groupByDepartment(entries: Entry[]) {
  const map = new Map<
    string,
    { departmentName: string; rows: Entry[] }
  >()
  for (const e of entries) {
    const cur = map.get(e.departmentId) ?? {
      departmentName: e.departmentName,
      rows: [],
    }
    cur.rows.push(e)
    map.set(e.departmentId, cur)
  }
  return Array.from(map.entries()).sort((a, b) =>
    a[1].departmentName.localeCompare(b[1].departmentName, 'he')
  )
}

export function LiveList({ entries, loading, error }: LiveListProps) {
  const grouped = useMemo(() => groupByDepartment(entries), [entries])

  if (loading) {
    return <p className="muted">{t.common.loading}</p>
  }
  if (error) {
    return <div className="error-banner">{t.common.error}</div>
  }

  if (entries.length === 0) {
    return <div className="empty-state">{t.admin.nobody}</div>
  }

  return (
    <div className="live-list">
      {grouped.map(([deptId, block]) => (
        <details key={deptId} className="live-list__group" open>
          <summary className="live-list__summary">
            <span>
              {block.departmentName} · {block.rows.length}{' '}
              {t.admin.deptPeopleCount}
            </span>
            <span className="live-list__chevron" aria-hidden>
              ‹
            </span>
          </summary>
          <div className="live-list__body">
            {block.rows.length === 0 ? (
              <p className="muted">{t.admin.deptNobody}</p>
            ) : (
              block.rows.map((row) => (
                <div key={row.id} className="live-list__row">
                  <span>
                    <EmployeeIdReveal
                      sealed={{
                        employeeKey: row.employeeKey,
                        employeeIv: row.employeeIv,
                        employeeCipher: row.employeeCipher,
                        employeeId: row.employeeId,
                      }}
                    />
                  </span>
                  <span className="live-list__time">
                    {formatDateTime(row.enteredAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </details>
      ))}
    </div>
  )
}
