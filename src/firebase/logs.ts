import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { normalizeEmployeeId, sealEmployeeId } from '@/crypto/employeeIdVault'
import { db } from './config'
import type { LogAction, LogDocWrite } from './types'

const logsCol = () => collection(db, 'logs')

export const LOGS_PAGE_SIZE = 50

export async function addLog(
  employeeId: string,
  departmentId: string,
  departmentName: string,
  action: LogAction
): Promise<string> {
  const normalized = normalizeEmployeeId(employeeId)
  const sealed = await sealEmployeeId(normalized)
  const payload: Omit<LogDocWrite, 'timestamp'> & {
    timestamp: ReturnType<typeof serverTimestamp>
  } = {
    employeeKey: sealed.employeeKey,
    employeeIv: sealed.employeeIv,
    employeeCipher: sealed.employeeCipher,
    departmentId,
    departmentName,
    action,
    timestamp: serverTimestamp(),
  }
  const ref = await addDoc(logsCol(), payload)
  return ref.id
}
