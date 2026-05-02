import type { Timestamp } from 'firebase/firestore'

export type DepartmentDoc = {
  name: string
  createdAt: Timestamp
}

/** Fields written for new presence rows (no plaintext employee id). */
export type EntryDocWrite = {
  employeeKey: string
  employeeIv: string
  employeeCipher: string
  departmentId: string
  departmentName: string
  enteredAt: Timestamp
}

/** Snapshot shape: new sealed rows or legacy plaintext `employeeId`. */
export type EntryDocRead = {
  employeeKey?: string
  employeeIv?: string
  employeeCipher?: string
  employeeId?: string
  departmentId: string
  departmentName: string
  enteredAt: Timestamp
}

export type LogAction = 'entry' | 'exit'

export type LogDocWrite = {
  employeeKey: string
  employeeIv: string
  employeeCipher: string
  departmentId: string
  departmentName: string
  action: LogAction
  timestamp: Timestamp
  /** When set, Firestore TTL (console policy on `logs.expiresAt`) deletes the doc after this time. */
  expiresAt: Timestamp
}

export type LogDocRead = {
  employeeKey?: string
  employeeIv?: string
  employeeCipher?: string
  employeeId?: string
  departmentId: string
  departmentName: string
  action: LogAction
  timestamp: Timestamp
  expiresAt?: Timestamp
}

export type Department = { id: string } & DepartmentDoc
export type Entry = { id: string } & EntryDocRead
export type LogEntry = { id: string } & LogDocRead
