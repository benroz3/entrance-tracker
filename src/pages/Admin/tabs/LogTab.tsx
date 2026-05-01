import { useState } from 'react'
import { Badge } from '@/components/Badge/Badge'
import { EmployeeIdReveal } from '@/components/EmployeeIdReveal/EmployeeIdReveal'
import { useAdminFilteredLogs } from '@/hooks/useAdminFilteredLogs'
import { useLogs } from '@/hooks/useLogs'
import { hasActiveAdminSearch, parseAdminSearch } from '@/utils/adminSearch'
import { formatDateTime } from '@/utils/formatTime'
import t from '@/i18n/he.json'

export function LogTab() {
  const [searchRaw, setSearchRaw] = useState('')
  const { items, loadMore, canLoadMore, error, loading } = useLogs()
  const { filteredLogs, searchPending } = useAdminFilteredLogs(
    items,
    searchRaw
  )

  const searchTokens = parseAdminSearch(searchRaw)
  const searchActive = hasActiveAdminSearch(searchTokens)

  if (error) {
    return <div className="error-banner">{t.common.error}</div>
  }

  return (
    <div>
      <div className="admin-search field">
        <label className="field__label" htmlFor="admin-log-search">
          {t.admin.searchLabel}
        </label>
        <input
          id="admin-log-search"
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
        {!loading && searchActive && !searchPending ? (
          <p className="admin-search__meta">
            {t.admin.searchShownLive} {filteredLogs.length}{' '}
            {t.admin.searchOutOf} {items.length} {t.admin.searchSuffixLog}
          </p>
        ) : null}
      </div>

      <div className="log-table-wrap">
        <table className="log-table">
          <thead>
            <tr>
              <th>{t.admin.logColAction}</th>
              <th>{t.admin.logColId}</th>
              <th>{t.admin.logColDept}</th>
              <th>{t.admin.logColTime}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="muted">
                  {t.common.loading}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted">
                  {t.admin.logEmpty}
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted">
                  {t.admin.searchNoResults}
                </td>
              </tr>
            ) : (
              filteredLogs.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Badge
                      variant={row.action === 'entry' ? 'entry' : 'exit'}
                      label={
                        row.action === 'entry'
                          ? t.admin.logActionEntry
                          : t.admin.logActionExit
                      }
                    />
                  </td>
                  <td>
                    <EmployeeIdReveal
                      sealed={{
                        employeeKey: row.employeeKey,
                        employeeIv: row.employeeIv,
                        employeeCipher: row.employeeCipher,
                        employeeId: row.employeeId,
                      }}
                    />
                  </td>
                  <td>{row.departmentName}</td>
                  <td>{formatDateTime(row.timestamp)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {canLoadMore ? (
        <button
          type="button"
          className="btn log-load-more"
          onClick={() => void loadMore()}
        >
          {t.admin.loadMore}
        </button>
      ) : null}
    </div>
  )
}
