import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, onSessionExpired, tokens } from './api'
import type { Perfil } from './types'

interface AuthCtx {
  user: Perfil | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (u: Perfil) => void
}

const Ctx = createContext<AuthCtx>(null as never)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(!!tokens.access)

  useEffect(() => {
    if (!tokens.access) return
    api<Perfil>('/auth/me/').then(setUser).catch(() => tokens.clear()).finally(() => setLoading(false))
  }, [])

  useEffect(() => onSessionExpired(() => setUser(null)), [])

  const login = useCallback(async (username: string, password: string) => {
    const data = await api<{ access: string; refresh: string; usuario: Perfil }>('/auth/login/', {
      method: 'POST', body: { username: username.trim().toLowerCase(), password }, auth: false,
    })
    tokens.set(data.access, data.refresh)
    setUser(data.usuario)
  }, [])

  const logout = useCallback(async () => {
    const refresh = tokens.refresh
    try { if (refresh) await api('/auth/logout/', { method: 'POST', body: { refresh } }) } catch { /* ya invalido */ }
    tokens.clear()
    setUser(null)
  }, [])

  return <Ctx.Provider value={{ user, loading, login, logout, setUser }}>{children}</Ctx.Provider>
}
