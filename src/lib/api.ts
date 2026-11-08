export const API_BASE =
  ((import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000').replace(/\/$/, '') + '/api/v1'

const ACCESS = 'vitrio.access'
const REFRESH = 'vitrio.refresh'

export const tokens = {
  get access() { return localStorage.getItem(ACCESS) },
  get refresh() { return localStorage.getItem(REFRESH) },
  set(access: string, refresh: string) {
    localStorage.setItem(ACCESS, access)
    localStorage.setItem(REFRESH, refresh)
  },
  clear() {
    localStorage.removeItem(ACCESS)
    localStorage.removeItem(REFRESH)
  },
}

export class ApiError extends Error {
  status: number
  codigo: string
  detalles?: Record<string, string[] | string>
  retryAfter?: number
  constructor(status: number, codigo: string, mensaje: string, detalles?: ApiError['detalles'], retryAfter?: number) {
    super(mensaje)
    this.status = status
    this.codigo = codigo
    this.detalles = detalles
    this.retryAfter = retryAfter
  }
}

type Listener = () => void
const sessionExpiredListeners = new Set<Listener>()
export const onSessionExpired = (fn: Listener) => {
  sessionExpiredListeners.add(fn)
  return () => { sessionExpiredListeners.delete(fn) }
}

async function parseError(res: Response): Promise<ApiError> {
  let body: any = null
  try { body = await res.json() } catch { /* sin cuerpo */ }
  const retry = Number(res.headers.get('Retry-After')) || undefined
  const e = body?.error
  return new ApiError(
    res.status,
    e?.codigo ?? 'error',
    e?.mensaje ?? body?.detail ?? `Error ${res.status}`,
    e?.detalles,
    retry,
  )
}

// El refresh es de un solo uso: se comparte una unica renovacion en curso.
let refreshing: Promise<boolean> | null = null

function refreshAccess(): Promise<boolean> {
  if (!refreshing) {
    refreshing = (async () => {
      const refresh = tokens.refresh
      if (!refresh) return false
      try {
        const res = await fetch(`${API_BASE}/auth/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh }),
        })
        if (!res.ok) return false
        const data = await res.json()
        tokens.set(data.access, data.refresh ?? refresh)
        return true
      } catch {
        return false
      }
    })().finally(() => { refreshing = null })
  }
  return refreshing
}

interface Opts { method?: string; body?: unknown; params?: Record<string, string | number | undefined | null>; auth?: boolean }

export async function api<T = unknown>(path: string, opts: Opts = {}): Promise<T> {
  const { method = 'GET', body, params, auth = true } = opts
  const qs = params
    ? '?' + new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => [k, String(v)]),
      ).toString()
    : ''
  const url = `${API_BASE}${path}${qs === '?' ? '' : qs}`

  const send = () =>
    fetch(url, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(auth && tokens.access ? { Authorization: `Bearer ${tokens.access}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

  let res: Response
  try { res = await send() } catch {
    throw new ApiError(0, 'red', 'No se pudo conectar con el servidor.')
  }

  if (res.status === 401 && auth && tokens.refresh) {
    if (await refreshAccess()) {
      res = await send()
    } else {
      tokens.clear()
      sessionExpiredListeners.forEach((f) => f())
    }
  }

  if (!res.ok) throw await parseError(res)
  if (res.status === 204) return undefined as T
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

export interface Page<T> { count: number; next: string | null; previous: string | null; results: T[] }

/** Convierte el error de validacion en {campo: mensaje}. */
export function fieldErrors(e: unknown): Record<string, string> {
  const out: Record<string, string> = {}
  if (e instanceof ApiError && e.detalles) {
    for (const [k, v] of Object.entries(e.detalles)) out[k] = Array.isArray(v) ? v.join(' ') : String(v)
  }
  return out
}
