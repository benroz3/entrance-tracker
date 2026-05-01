import { useEffect, useState } from 'react'
import {
  revealEmployeeId,
  type SealedEmployeeFields,
} from '@/crypto/employeeIdVault'

export function EmployeeIdReveal({ sealed }: { sealed: SealedEmployeeFields }) {
  const [text, setText] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    revealEmployeeId(sealed)
      .then((t) => {
        if (!cancelled) setText(t)
      })
      .catch(() => {
        if (!cancelled) setText('—')
      })
    return () => {
      cancelled = true
    }
  }, [
    sealed.employeeCipher,
    sealed.employeeId,
    sealed.employeeIv,
    sealed.employeeKey,
  ])

  return <span>{text ?? '…'}</span>
}
