import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import {
  getEmployeeSearchKey,
  normalizeEmployeeId,
  sealEmployeeId,
} from '@/crypto/employeeIdVault'
import { db } from './config'
import type { Entry, EntryDocRead, EntryDocWrite } from './types'

const entriesCol = () => collection(db, 'entries')

export function subscribeEntries(
  onData: (entries: Entry[]) => void,
  onError?: (e: Error) => void
): () => void {
  return onSnapshot(
    entriesCol(),
    (snap) => {
      const list: Entry[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as EntryDocRead),
      }))
      onData(list)
    },
    (err) => {
      onError?.(err as Error)
    }
  )
}

export async function findEntriesByEmployeeId(
  employeeId: string
): Promise<Entry[]> {
  const normalized = normalizeEmployeeId(employeeId)
  if (!normalized) {
    return []
  }
  const key = await getEmployeeSearchKey(normalized)
  const byKey = query(entriesCol(), where('employeeKey', '==', key))
  let snap = await getDocs(byKey)
  if (snap.empty) {
    const legacy = query(entriesCol(), where('employeeId', '==', normalized))
    snap = await getDocs(legacy)
  }
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as EntryDocRead),
  }))
}

export async function addEntry(
  employeeId: string,
  departmentId: string,
  departmentName: string
): Promise<string> {
  const normalized = normalizeEmployeeId(employeeId)
  const sealed = await sealEmployeeId(normalized)
  const payload: Omit<EntryDocWrite, 'enteredAt'> & {
    enteredAt: ReturnType<typeof serverTimestamp>
  } = {
    employeeKey: sealed.employeeKey,
    employeeIv: sealed.employeeIv,
    employeeCipher: sealed.employeeCipher,
    departmentId,
    departmentName,
    enteredAt: serverTimestamp(),
  }
  const ref = await addDoc(entriesCol(), payload)
  return ref.id
}

export async function deleteEntry(entryId: string): Promise<void> {
  await deleteDoc(doc(db, 'entries', entryId))
}
