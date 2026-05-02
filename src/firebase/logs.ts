import {
  addDoc,
  collection,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { normalizeEmployeeId, sealEmployeeId } from '@/crypto/employeeIdVault'
import { db } from './config'
import type { LogAction, LogDocWrite } from './types'

const logsCol = () => collection(db, 'logs')

export const LOGS_PAGE_SIZE = 50

/** Keep logs this many days, then Firestore TTL removes them (enable policy on `expiresAt` in console). */
const LOG_RETENTION_DAYS = 90

export async function addLog(
  employeeId: string,
  departmentId: string,
  departmentName: string,
  action: LogAction
): Promise<string> {
  const normalized = normalizeEmployeeId(employeeId)
  const sealed = await sealEmployeeId(normalized)
  const expiresAt = Timestamp.fromMillis(
    Date.now() + LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000
  )
  const payload: Omit<LogDocWrite, 'timestamp' | 'expiresAt'> & {
    timestamp: ReturnType<typeof serverTimestamp>
    expiresAt: Timestamp
  } = {
    employeeKey: sealed.employeeKey,
    employeeIv: sealed.employeeIv,
    employeeCipher: sealed.employeeCipher,
    departmentId,
    departmentName,
    action,
    timestamp: serverTimestamp(),
    expiresAt,
  }
  const ref = await addDoc(logsCol(), payload)
  return ref.id
}
