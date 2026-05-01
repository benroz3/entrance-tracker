import { FormEvent, useMemo, useState } from 'react'
import { addDepartment, deleteDepartment } from '@/firebase/departments'
import { useDepartments } from '@/hooks/useDepartments'
import { useEntries } from '@/hooks/useEntries'
import t from '@/i18n/he.json'

export function DepartmentsTab() {
  const { departments, loading, error } = useDepartments()
  const { entries } = useEntries()
  const [name, setName] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of entries) {
      map.set(e.departmentId, (map.get(e.departmentId) ?? 0) + 1)
    }
    return map
  }, [entries])

  const onAdd = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const trimmed = name.trim()
    if (!trimmed) return
    setBusyId('__add__')
    try {
      await addDepartment(trimmed)
      setName('')
    } catch {
      setFormError(t.common.error)
    } finally {
      setBusyId(null)
    }
  }

  const onDelete = async (id: string) => {
    const c = counts.get(id) ?? 0
    if (c > 0) return
    setBusyId(id)
    setFormError(null)
    try {
      await deleteDepartment(id)
    } catch {
      setFormError(t.common.error)
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return <p className="muted">{t.common.loading}</p>
  }
  if (error) {
    return <div className="error-banner">{t.common.error}</div>
  }

  return (
    <div>
      {formError ? <div className="error-banner">{formError}</div> : null}

      <form className="dept-add" onSubmit={onAdd}>
        <label className="field__label" htmlFor="newDept">
          {t.admin.deptNameLabel}
        </label>
        <div className="dept-add__row">
          <input
            id="newDept"
            className="input"
            value={name}
            placeholder={t.admin.deptPlaceholder}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            type="submit"
            className="btn btn--primary"
            disabled={busyId !== null}
          >
            {t.admin.deptAddBtn}
          </button>
        </div>
      </form>

      {departments.length === 0 ? (
        <div className="empty-state">{t.admin.deptEmpty}</div>
      ) : (
        <div className="dept-list">
          {departments.map((d) => {
            const c = counts.get(d.id) ?? 0
            const blocked = c > 0
            return (
              <div key={d.id} className="dept-row">
                <div className="dept-row__name">{d.name}</div>
                <div className="dept-row__meta">
                  {c === 0 ? t.admin.deptNobody : `${c} ${t.admin.deptPeopleCount}`}
                </div>
                <div
                  className="btn-icon-wrap"
                  {...(blocked ? { 'data-tooltip': t.admin.deptDeleteBlocked } : {})}
                >
                  <button
                    type="button"
                    className="btn btn--danger"
                    disabled={blocked || busyId !== null}
                    onClick={() => void onDelete(d.id)}
                  >
                    {t.admin.deptDeleteBtn}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
