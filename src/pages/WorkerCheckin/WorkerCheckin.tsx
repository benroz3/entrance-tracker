import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  getEmployeeSearchKey,
  normalizeEmployeeId,
} from '@/crypto/employeeIdVault'
import {
  addEntry,
  deleteEntry,
  findEntriesByEmployeeId,
} from '@/firebase/entries'
import { addLog } from '@/firebase/logs'
import { useDepartments } from '@/hooks/useDepartments'
import { useEntries } from '@/hooks/useEntries'
import t from '@/i18n/he.json'

type Result = 'in' | 'out' | null

export function WorkerCheckin() {
  const navigate = useNavigate()
  const { departments, loading: loadingDepts, error: deptError } =
    useDepartments()
  const { entries, loading: loadingEntries, error: entriesError } =
    useEntries()
  const [departmentId, setDepartmentId] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<Result>(null)
  const [searchKey, setSearchKey] = useState<string | null>(null)
  const [keyReady, setKeyReady] = useState(true)
  const [cryptoError, setCryptoError] = useState(false)

  const trimmedId = employeeId.trim()
  const normalizedId = useMemo(
    () => normalizeEmployeeId(trimmedId),
    [trimmedId]
  )

  useEffect(() => {
    if (!normalizedId) {
      setSearchKey(null)
      setKeyReady(true)
      setCryptoError(false)
      return
    }
    let cancelled = false
    setKeyReady(false)
    setCryptoError(false)
    getEmployeeSearchKey(normalizedId)
      .then((k) => {
        if (!cancelled) {
          setSearchKey(k)
          setKeyReady(true)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSearchKey(null)
          setCryptoError(true)
          setKeyReady(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [normalizedId])

  const isInside = useMemo(
    () =>
      keyReady &&
      !cryptoError &&
      normalizedId.length > 0 &&
      entries.some(
        (e) =>
          (e.employeeKey != null && e.employeeKey === searchKey) ||
          (e.employeeId != null && e.employeeId === normalizedId)
      ),
    [entries, normalizedId, searchKey, keyReady, cryptoError]
  )

  useEffect(() => {
    if (isInside) {
      setDepartmentId('')
    }
  }, [isInside])

  useEffect(() => {
    if (!result) return
    const timer = window.setTimeout(() => navigate('/'), 3000)
    return () => window.clearTimeout(timer)
  }, [result, navigate])

  const onChangeEmployeeId = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8)
    setEmployeeId(digits)
    setFormError(null)
  }

  const showDeptSelect =
    normalizedId.length > 0 &&
    keyReady &&
    !cryptoError &&
    !loadingEntries &&
    entriesError === null &&
    !isInside

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!normalizedId) {
      setFormError(t.checkin.errorEmptyId)
      return
    }

    setSubmitting(true)
    try {
      const existing = await findEntriesByEmployeeId(normalizedId)
      if (existing.length > 0) {
        const first = existing[0]
        for (const row of existing) {
          await deleteEntry(row.id)
        }
        await addLog(
          normalizedId,
          first.departmentId,
          first.departmentName,
          'exit'
        )
        setResult('out')
      } else {
        if (!departmentId) {
          setFormError(t.checkin.errorNotFound)
          return
        }
        const dept = departments.find((d) => d.id === departmentId)
        if (!dept) {
          setFormError(t.checkin.errorNotFound)
          return
        }
        await addEntry(normalizedId, dept.id, dept.name)
        await addLog(normalizedId, dept.id, dept.name, 'entry')
        setResult('in')
      }
    } catch {
      setFormError(t.common.error)
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <div className="confirm-screen">
        <p
          className={
            result === 'in'
              ? 'confirm-screen__headline confirm-screen__headline--in'
              : 'confirm-screen__headline confirm-screen__headline--out'
          }
        >
          {result === 'in' ? t.checkin.confirmIn : t.checkin.confirmOut}
        </p>
        <p className="confirm-screen__sub">{t.checkin.redirectMsg}</p>
      </div>
    )
  }

  const dataError = deptError ?? entriesError
  const submitDisabled =
    submitting ||
    !!dataError ||
    cryptoError ||
    !keyReady ||
    (showDeptSelect && (loadingDepts || departments.length === 0))

  return (
    <div className="stack">
      <div className="page-header">
        <Link className="link-back" to="/">
          {t.common.back}
        </Link>
        <span className="page-header__spacer" />
      </div>

      <h1 className="page-title">{t.checkin.title}</h1>

      {cryptoError ? (
        <div className="error-banner">{t.common.cryptoError}</div>
      ) : null}
      {dataError ? <div className="error-banner">{t.common.error}</div> : null}
      {formError ? <div className="error-banner">{formError}</div> : null}

      <form onSubmit={onSubmit} noValidate>
        <div className="field">
          <label className="field__label" htmlFor="employeeId">
            {t.checkin.enterIdLabel}
          </label>
          <input
            id="employeeId"
            className="input"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            maxLength={8}
            placeholder={t.checkin.enterIdPlaceholder}
            value={employeeId}
            onChange={(e) => onChangeEmployeeId(e.target.value)}
            disabled={!!dataError || cryptoError}
          />
        </div>

        {(loadingEntries && normalizedId.length > 0) ||
        (!keyReady && normalizedId.length > 0 && !cryptoError) ? (
          <p className="muted">{t.common.loading}</p>
        ) : null}

        {showDeptSelect ? (
          <div className="field">
            <label className="field__label" htmlFor="department">
              {t.checkin.selectDept}
            </label>
            <select
              id="department"
              className="select"
              value={departmentId}
              onChange={(e) => {
                setDepartmentId(e.target.value)
                setFormError(null)
              }}
              disabled={loadingDepts || !!deptError}
            >
              <option value="" disabled>
                {t.checkin.selectDept}
              </option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <button
          type="submit"
          className="btn btn--primary"
          disabled={submitDisabled}
        >
          {loadingDepts && showDeptSelect ? t.common.loading : t.checkin.submitBtn}
        </button>
      </form>
    </div>
  )
}
