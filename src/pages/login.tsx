import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { AlertTriangle, ChevronRight, Eye, EyeOff, FolderKanban, Info, LayoutTemplate, Lock, MonitorSmartphone, User } from 'lucide-react'
import { ApiError } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { Logo, LogoMark } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MuroPantallas } from '@/components/muro'

const YEAR = new Date().getFullYear()

const MURO = Array.from({ length: 40 }, (_, i) => ({
  id: i, nombre: '', estado: i % 9 === 4 ? 'INACTIVO' : i % 13 === 6 ? 'SIN_CONEXION' : 'ACTIVO',
}))

const POINTS = [
  { icon: FolderKanban, title: 'Proyectos y clientes en un solo lugar', text: 'Cada empresa ve únicamente lo suyo, con roles y permisos claros.' },
  { icon: LayoutTemplate, title: 'Plantillas y contenidos reutilizables', text: 'Organiza videos, imágenes y plantillas para todas tus pantallas.' },
  { icon: MonitorSmartphone, title: 'Control de tus pantallas en tiempo real', text: 'Consulta el estado y la última conexión de cada dispositivo.' },
]

export default function Login() {
  const { user, login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [bloqueo, setBloqueo] = useState(false)
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBloqueo(false)
    setBusy(true)
    try {
      await login(username, password)
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setBloqueo(true)
        setError(`Demasiados intentos. Reintenta en ${err.retryAfter ?? 60} segundos.`)
      } else if (err instanceof ApiError && err.status === 401) {
        setError('Usuario o contraseña incorrectos.')
      } else {
        setError((err as Error).message)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-[1.1fr_1fr]">
      {/* Panel de marca */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-white/[0.06] bg-[#070d18] p-12 lg:flex">
        <MuroPantallas
          pantallas={MURO} max={40} columnas={6} decorativo
          className="pointer-events-none absolute inset-0 content-start p-6 opacity-[0.17] [mask-image:radial-gradient(ellipse_at_70%_20%,#000_10%,transparent_75%)]"
        />
        <div
          className="pointer-events-none absolute -bottom-40 -left-32 size-[560px] rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)' }}
        />
        <div className="relative flex items-center gap-3">
          <Logo size={30} />
          <span className="mono inline-flex items-center gap-1.5 rounded-md border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[0.65rem] uppercase tracking-wider text-emerald-300">
            <span className="size-1.5 animate-[pulse-dot_1.6s_infinite] rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            Sala de control
          </span>
        </div>

        <div className="relative max-w-xl">
          <h2 className="text-5xl font-semibold leading-[1.1] tracking-tight text-white">
            Tu cartelería digital, <span className="text-gradient">bajo control.</span>
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-slate-400">
            Gestiona clientes, proyectos, contenidos y pantallas desde un único panel.
          </p>
          <ul className="mt-10 grid gap-3">
            {POINTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-4 rounded-xl border border-white/[0.08] bg-[#0d1527]/80 p-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#162238] ring-1 ring-white/10">
                  <Icon className="size-5 text-blue-300" />
                </span>
                <span>
                  <span className="block font-medium text-slate-100">{title}</span>
                  <span className="mt-0.5 block text-sm text-slate-400">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="etiqueta relative">© {YEAR} Vitrio</p>
      </div>

      {/* Formulario */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-[fadeUp_0.4s_ease]">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <LogoMark size={26} />
            <span className="text-xl font-bold tracking-[0.08em]">VITRIO</span>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d1527] p-7 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] sm:p-8">
            <div className="pointer-events-none absolute right-0 top-0 size-28 bg-[linear-gradient(225deg,rgba(37,99,235,0.3)_0%,transparent_60%)]" />
            <h1 className="text-3xl font-semibold tracking-tight">Iniciar sesión</h1>
            <p className="mb-7 mt-2 text-sm text-muted-foreground">Ingresa con tu usuario y contraseña para acceder a la sala de control.</p>

            <form onSubmit={submit} className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="username">Usuario</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoFocus
                    placeholder="correo@empresa.com"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-11 pl-10"
                  />
                </div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Info className="size-3.5 shrink-0" /> Si tu cuenta fue migrada, tu usuario es tu correo electrónico.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={show ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pl-10 pr-10"
                  />
                  <button
                    type="button"
                    aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${
                    bloqueo
                      ? 'border-amber-400/30 bg-amber-400/10 text-amber-200'
                      : 'border-red-400/30 bg-red-500/10 text-red-300'
                  }`}
                >
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <span>
                    <span className="etiqueta mb-0.5 block text-inherit">{bloqueo ? 'Bloqueo de seguridad' : 'Fallo de autenticación'}</span>
                    {error}
                  </span>
                </div>
              )}

              <Button type="submit" size="lg" className="mt-1 h-12 text-sm font-semibold" disabled={busy || !username || !password}>
                {busy ? 'Ingresando…' : <>Ingresar <ChevronRight /></>}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
