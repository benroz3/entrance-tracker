import { Badge } from '@/components/Badge/Badge'
import { EmployeeIdReveal } from '@/components/EmployeeIdReveal/EmployeeIdReveal'
import { useLogs } from '@/hooks/useLogs'
import { formatDateTime } from '@/utils/formatTime'
import t from '@/i18n/he.json'

export function LogTab() {
  const { items, loadMore, canLoadMore, error, loading } = useLogs()

  if (error) {
    return <div className="error-banner">{t.common.error}</div>
  }

  return (
    <div>
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
            ) : (
              items.map((row) => (
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
