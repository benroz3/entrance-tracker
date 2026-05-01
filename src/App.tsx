import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Admin } from '@/pages/Admin/Admin'
import { AdminPin } from '@/pages/AdminPin/AdminPin'
import { Home } from '@/pages/Home/Home'
import { WorkerCheckin } from '@/pages/WorkerCheckin/WorkerCheckin'
import type { ReactNode } from 'react'

function RequireAdmin({ children }: { children: ReactNode }) {
  const { adminUnlocked } = useAuth()
  if (!adminUnlocked) {
    return <Navigate to="/admin/pin" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <div className="layout">
      <main className="layout__main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/worker/pin"
            element={<Navigate to="/worker/checkin" replace />}
          />
          <Route path="/worker/checkin" element={<WorkerCheckin />} />
          <Route path="/admin/pin" element={<AdminPin />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <Admin />
              </RequireAdmin>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}
