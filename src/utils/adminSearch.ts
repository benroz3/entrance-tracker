import type { Timestamp } from 'firebase/firestore'
import {
  EMPLOYEE_ID_LENGTH,
  getEmployeeSearchKey,
  normalizeEmployeeId,
  revealEmployeeId,
  type SealedEmployeeFields,
} from '@/crypto/employeeIdVault'
import { formatDateTime } from '@/utils/formatTime'

/** Whitespace-separated search terms; empty query means no filter. */
export function parseAdminSearch(raw: string): string[] {
  return raw.trim().split(/\s+/).filter(Boolean)
}

export function timestampMatchesDateNeedle(
  ts: Timestamp,
  needle: string
): boolean {
  const n = needle.trim().toLowerCase()
  if (!n) return true

  const formatted = formatDateTime(ts).toLowerCase()
  if (formatted.includes(n)) return true

  const compactFmt = formatted.replace(/\s/g, '')
  const compactNeedle = n.replace(/\s/g, '')
  if (compactNeedle.length > 0 && compactFmt.includes(compactNeedle)) return true

  return false
}

type RowWithEmployeeAndTime = SealedEmployeeFields & {
  enteredAt?: Timestamp
  timestamp?: Timestamp
}

function rowTimestamp(row: RowWithEmployeeAndTime): Timestamp | null {
  return row.enteredAt ?? row.timestamp ?? null
}

async function employeeDigitsMatch(
  row: RowWithEmployeeAndTime,
  digits: string
): Promise<boolean> {
  if (!digits) return false

  if (row.employeeId && (!row.employeeCipher || !row.employeeIv)) {
    return row.employeeId.includes(digits)
  }

  if (digits.length === EMPLOYEE_ID_LENGTH && row.employeeKey) {
    const key = await getEmployeeSearchKey(digits)
    return row.employeeKey === key
  }

  if (row.employeeCipher && row.employeeIv) {
    try {
      const plain = await revealEmployeeId(row)
      return plain.includes(digits)
    } catch {
      return false
    }
  }

  return false
}

/**
 * One token matches if it appears in the formatted date/time **or** in the employee id.
 * Date-shaped tokens (contain / . -) only check the time column.
 */
async function tokenMatchesRow(
  row: RowWithEmployeeAndTime,
  token: string
): Promise<boolean> {
  const ts = rowTimestamp(row)

  if (/[/.-]/.test(token) && /\d/.test(token)) {
    return ts ? timestampMatchesDateNeedle(ts, token) : false
  }

  if (/^\d+$/.test(token)) {
    if (token.length === 4) {
      const y = Number.parseInt(token, 10)
      if (y >= 1990 && y <= 2100) {
        const dateOk = ts ? timestampMatchesDateNeedle(ts, token) : false
        const empOk = await employeeDigitsMatch(
          row,
          normalizeEmployeeId(token)
        )
        return dateOk || empOk
      }
    }

    const digits = normalizeEmployeeId(token)
    const empOk = await employeeDigitsMatch(row, digits)
    const dateOk = ts ? timestampMatchesDateNeedle(ts, token) : false
    return empOk || dateOk
  }

  if (/\d/.test(token)) {
    return ts ? timestampMatchesDateNeedle(ts, token) : false
  }

  return false
}

export async function rowMatchesAdminSearch(
  row: RowWithEmployeeAndTime,
  tokens: string[]
): Promise<boolean> {
  if (tokens.length === 0) return true

  for (const token of tokens) {
    if (!(await tokenMatchesRow(row, token))) {
      return false
    }
  }

  return true
}

export function hasActiveAdminSearch(tokens: string[]): boolean {
  return tokens.length > 0
}
