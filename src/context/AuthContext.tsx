import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type AuthContextValue = {
  adminUnlocked: boolean
  unlockAdmin: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [adminUnlocked, setAdminUnlocked] = useState(false)

  const unlockAdmin = useCallback(() => setAdminUnlocked(true), [])

  const value = useMemo(
    () => ({
      adminUnlocked,
      unlockAdmin,
    }),
    [adminUnlocked, unlockAdmin]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
