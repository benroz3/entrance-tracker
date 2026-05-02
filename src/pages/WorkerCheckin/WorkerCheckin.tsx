import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  EMPLOYEE_ID_LENGTH,
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
import t from '@/i18n/he.json'

type Result = 'in' | 'out' | null

function intentFromParams(raw: string | null): 'entry' | 'exit' | null {
  return raw === 'entry' || raw === 'exit' ? raw : null
}

export function WorkerCheckin() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const intent = intentFromParams(searchParams.get('intent'))

  const { departments, loading: loadingDepts, error: deptError } =
    useDepartments()
  const [departmentId, setDepartmentId] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<Result>(null)
  const [keyReady, setKeyReady] = useState(true)
  const [cryptoError, setCryptoError] = useState(false)
  const employeeInputRef = useRef<HTMLInputElement>(null)

  const trimmedId = employeeId.trim()
  const normalizedId = useMemo(
    () => normalizeEmployeeId(trimmedId),
    [trimmedId]
  )

  useEffect(() => {
    if (!normalizedId) {
      setKeyReady(true)
      setCryptoError(false)
      return
    }
    if (normalizedId.length !== EMPLOYEE_ID_LENGTH) {
      setKeyReady(true)
      setCryptoError(false)
      return
    }
    let cancelled = false
    setKeyReady(false)
    setCryptoError(false)
    getEmployeeSearchKey(normalizedId)
      .then(() => {
        if (!cancelled) setKeyReady(true)
      })
      .catch(() => {
        if (!cancelled) {
          setCryptoError(true)
          setKeyReady(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [normalizedId])

  useEffect(() => {
    if (!result) return
    const timer = window.setTimeout(() => navigate('/'), 3000)
    return () => window.clearTimeout(timer)
  }, [result, navigate])

  useEffect(() => {
    if (!intent) return
    if (result !== null) return
    if (cryptoError) return
    if (deptError) return
    employeeInputRef.current?.focus()
  }, [intent, result, deptError, cryptoError])

  const onChangeEmployeeId = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, EMPLOYEE_ID_LENGTH)
    setEmployeeId(digits)
    setFormError(null)
  }

  const showDeptSelect =
    intent === 'entry' &&
    normalizedId.length === EMPLOYEE_ID_LENGTH &&
    keyReady &&
    !cryptoError &&
    !submitting

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!intent) return

    if (!normalizedId) {
      setFormError(t.checkin.errorEmptyId)
      return
    }
    if (normalizedId.length !== EMPLOYEE_ID_LENGTH) {
      setFormError(t.checkin.errorIdLength)
      return
    }

    setSubmitting(true)
    try {
      const existing = await findEntriesByEmployeeId(normalizedId)

      if (intent === 'entry') {
        if (existing.length > 0) {
          setFormError(t.checkin.errorAlreadyInside)
          return
        }
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
      } else {
        if (existing.length === 0) {
          setFormError(t.checkin.errorNotInside)
          return
        }
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

  if (!intent) {
    return (
      <div className="stack">
        <div className="page-header">
          <Link className="link-back" to="/">
            {t.common.back}
          </Link>
          <span className="page-header__spacer" />
        </div>
        <h1 className="page-title">{t.checkin.chooseIntentTitle}</h1>
        <div className="home-screen__actions">
          <Link className="btn btn--primary" to="/worker/checkin?intent=entry">
            {t.checkin.titleEntry}
          </Link>
          <Link className="btn btn--danger" to="/worker/checkin?intent=exit">
            {t.checkin.titleExit}
          </Link>
        </div>
      </div>
    )
  }

  const submitDisabled =
    submitting ||
    !!deptError ||
    cryptoError ||
    !keyReady ||
    (normalizedId.length > 0 &&
      normalizedId.length !== EMPLOYEE_ID_LENGTH) ||
    (intent === 'entry' &&
      showDeptSelect &&
      (loadingDepts || departments.length === 0 || !departmentId))

  const pageTitle =
    intent === 'entry' ? t.checkin.titleEntry : t.checkin.titleExit

  return (
    <div className="stack">
      <div className="page-header">
        <Link className="link-back" to="/worker/checkin">
          {t.common.back}
        </Link>
        <span className="page-header__spacer" />
      </div>

      <h1 className="page-title">{pageTitle}</h1>

      {cryptoError ? (
        <div className="error-banner">{t.common.cryptoError}</div>
      ) : null}
      {deptError ? <div className="error-banner">{t.common.error}</div> : null}
      {formError ? <div className="error-banner">{formError}</div> : null}

      <form onSubmit={onSubmit} noValidate>
        <div className="field">
          <label className="field__label" htmlFor="employeeId">
            {t.checkin.enterIdLabel}
          </label>
          <input
            ref={employeeInputRef}
            id="employeeId"
            className="input"
            inputMode="numeric"
            pattern="[0-9]{7}"
            autoComplete="off"
            maxLength={EMPLOYEE_ID_LENGTH}
            placeholder={t.checkin.enterIdPlaceholder}
            value={employeeId}
            onChange={(e) => onChangeEmployeeId(e.target.value)}
            disabled={!!deptError || cryptoError}
          />
        </div>

        {!keyReady &&
        normalizedId.length === EMPLOYEE_ID_LENGTH &&
        !cryptoError ? (
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
