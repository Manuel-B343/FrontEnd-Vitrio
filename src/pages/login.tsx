import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Eye, EyeOff, FolderKanban, MonitorSmartphone, LayoutTemplate } from 'lucide-react'
import { ApiError } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { Logo, LogoMark } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const POINTS = [
  { icon: FolderKanban, text: 'Proyectos y clientes en un solo lugar' },
  { icon: LayoutTemplate, text: 'Plantillas y contenidos reutilizables' },
  { icon: MonitorSmartphone, text: 'Control de tus pantallas en tiempo real' },
]

export default function Login() {
  const { user, login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(username, password)
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
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
    <div className="grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
      {/* Panel de marca */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-white/[0.06] bg-gradient-to-br from-[#10204a] via-[#0d1830] to-[#0a1020] p-12 lg:flex">
        <div
          className="pointer-events-none absolute -bottom-40 -left-32 size-[520px] rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, #3b5bdb 0%, transparent 70%)' }}
        />
        <Logo size={30} />
        <div className="relative max-w-md">
          <h2 className="text-4xl font-bold leading-tight tracking-tight text-white">
            Tu cartelería digital, <span className="text-blue-400">bajo control.</span>
          </h2>
          <ul className="mt-8 grid gap-4">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-slate-300">
                <span className="flex size-9 items-center justify-center rounded-lg bg-white/[0.06] ring-1 ring-white/10">
                  <Icon className="size-4 text-blue-400" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-slate-500">© {new Date().getFullYear()} Vitrio</p>
      </div>

      {/* Formulario */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-[fadeUp_0.4s_ease]">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <LogoMark size={26} />
            <span className="text-xl font-black tracking-[0.07em]">VIT<span className="font-light opacity-60">RIO</span></span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Iniciar sesión</h1>
          <p className="mb-8 mt-1.5 text-sm text-muted-foreground">Ingresa con tu usuario y contraseña.</p>

          <form onSubmit={submit} className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                autoComplete="username"
                autoFocus
                placeholder="correo@empresa.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-10"
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
              <p role="alert" className="rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="h-11 text-sm font-semibold" disabled={busy || !username || !password}>
              {busy ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
