import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import t from '@/i18n/he.json'
import './AdminPin.scss'

const ADMIN_PIN = String(import.meta.env.VITE_ADMIN_PIN ?? '')

export function AdminPin() {
  const navigate = useNavigate()
  const { unlockAdmin } = useAuth()
  const [value, setValue] = useState('')
  const [shake, setShake] = useState(false)
  const [showError, setShowError] = useState(false)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setShowError(false)
    const entered = value.trim()
    const expected = ADMIN_PIN.trim()
    if (entered.length === 0) {
      return
    }
    if (entered === expected) {
      unlockAdmin()
      navigate('/admin', { replace: true })
      return
    }
    setShake(true)
    setShowError(true)
    setValue('')
    window.setTimeout(() => setShake(false), 450)
  }

  return (
    <div className="stack">
      <div className="page-header">
        <button
          type="button"
          className="link-back"
          onClick={() => navigate('/')}
        >
          {t.common.back}
        </button>
        <span className="page-header__spacer" />
      </div>

      <h1 className="page-title">{t.pin.adminTitle}</h1>

      <form className="admin-pin" onSubmit={onSubmit} noValidate>
        <div className="field">
          <label className="field__label" htmlFor="admin-pin-input">
            {t.pin.passwordLabel}
          </label>
          <input
            id="admin-pin-input"
            className={
              shake
                ? 'input admin-pin__input admin-pin__input--shake'
                : 'input admin-pin__input'
            }
            type="password"
            name="admin-pin"
            autoComplete="current-password"
            inputMode="text"
            spellCheck={false}
            value={value}
            onChange={(e) => {
              setShowError(false)
              setValue(e.target.value)
            }}
            placeholder={t.pin.passwordPlaceholder}
          />
        </div>
        {showError ? (
          <p className="admin-pin__error" role="alert">
            {t.pin.error}
          </p>
        ) : null}
        <button type="submit" className="btn btn--primary">
          {t.pin.submitBtn}
        </button>
      </form>
    </div>
  )
}
