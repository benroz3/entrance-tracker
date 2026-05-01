import { useMemo, useState } from 'react'
import { EmployeeIdReveal } from '@/components/EmployeeIdReveal/EmployeeIdReveal'
import { useAdminFilteredEntries } from '@/hooks/useAdminFilteredEntries'
import type { Entry } from '@/firebase/types'
import { hasActiveAdminSearch, parseAdminSearch } from '@/utils/adminSearch'
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
  const [searchRaw, setSearchRaw] = useState('')
  const { filteredEntries, searchPending } = useAdminFilteredEntries(
    entries,
    searchRaw
  )

  const grouped = useMemo(
    () => groupByDepartment(filteredEntries),
    [filteredEntries]
  )

  const searchTokens = parseAdminSearch(searchRaw)
  const searchActive = hasActiveAdminSearch(searchTokens)

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
      <div className="admin-search field">
        <label className="field__label" htmlFor="admin-live-search">
          {t.admin.searchLabel}
        </label>
        <input
          id="admin-live-search"
          className="input"
          type="search"
          autoComplete="off"
          placeholder={t.admin.searchPlaceholder}
          value={searchRaw}
          onChange={(e) => setSearchRaw(e.target.value)}
        />
        {searchPending ? (
          <p className="admin-search__meta">{t.admin.searchFiltering}</p>
        ) : null}
        {searchActive && !searchPending ? (
          <p className="admin-search__meta">
            {t.admin.searchShownLive} {filteredEntries.length}{' '}
            {t.admin.searchOutOf} {entries.length}{' '}
            {t.admin.searchSuffixLive}
          </p>
        ) : null}
      </div>

      {filteredEntries.length === 0 ? (
        <div className="empty-state">{t.admin.searchNoResults}</div>
      ) : (
        grouped.map(([deptId, block]) => (
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
        ))
      )}
    </div>
  )
}
