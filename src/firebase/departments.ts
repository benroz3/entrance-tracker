import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'
import type { Department, DepartmentDoc } from './types'

const departmentsCol = () => collection(db, 'departments')

export function subscribeDepartments(
  onData: (departments: Department[]) => void,
  onError?: (e: Error) => void
): () => void {
  const q = query(departmentsCol(), orderBy('name', 'asc'))
  return onSnapshot(
    q,
    (snap) => {
      const list: Department[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as DepartmentDoc),
      }))
      onData(list)
    },
    (err) => {
      onError?.(err as Error)
    }
  )
}

export async function addDepartment(name: string): Promise<string> {
  const ref = await addDoc(departmentsCol(), {
    name: name.trim(),
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function deleteDepartment(departmentId: string): Promise<void> {
  await deleteDoc(doc(db, 'departments', departmentId))
}
