import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, ArrowRight, Building2, CheckCircle2, Clock, FileVideo, FolderKanban, MonitorSmartphone, Radio, Users,
  type LucideIcon,
} from 'lucide-react'
import { api, type Page } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { ROL_LABEL } from '@/lib/types'
import { ESTADO_COLOR, Pill } from '@/components/pill'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type Row = Record<string, any>

const ESTADO_PROYECTO: Record<string, string> = {
  PROPUESTO: 'Propuesto', ANALISIS: 'Análisis', APROBADO: 'Aprobado', PLANIFICACION: 'Planificación', EJECUCION: 'Ejecución',
  SEGUIMIENTO: 'Seguimiento', PAUSADO: 'Pausado', CANCELADO: 'Cancelado', COMPLETADO: 'Completado', CERRADO: 'Cerrado',
}
const ESTADO_DISPOSITIVO: Record<string, string> = { ACTIVO: 'Activo', INACTIVO: 'Inactivo', SIN_CONEXION: 'Sin conexión' }
const FINALIZADOS = ['COMPLETADO', 'CERRADO', 'CANCELADO']

/* ---------- Datos ---------- */

function useList(path: string, params: Record<string, string | number> = {}) {
  return useQuery({
    queryKey: ['dash', path, params],
    queryFn: () => api<Page<Row>>(`/${path}/`, { params }),
  })
}

const useCount = (path: string) => {
  const q = useList(path, { page_size: 1 })
  return { loading: q.isLoading, value: q.data?.count }
}

/* ---------- Utilidades ---------- */

function parseFecha(v: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T00:00:00`) : new Date(v)
}

function diasHasta(v: string) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return Math.round((parseFecha(v).getTime() - hoy.getTime()) / 86_400_000)
}

function hace(v?: string | null) {
  if (!v) return 'Nunca'
  const min = Math.max(0, Math.round((Date.now() - new Date(v).getTime()) / 60_000))
  if (min < 1) return 'Ahora mismo'
  if (min < 60) return `Hace ${min} min`
  if (min < 60 * 24) return `Hace ${Math.round(min / 60)} h`
  return `Hace ${Math.round(min / 1440)} d`
}

function contar(rows: Row[], campo: string) {
  const out: Record<string, number> = {}
  for (const r of rows) out[r[campo]] = (out[r[campo]] ?? 0) + 1
  return out
}

const pct = (n: number, total: number) => (total ? `${((n / total) * 100).toFixed(1)}%` : '0%')

/* ---------- Piezas ---------- */

function Stat({ title, value, loading, icon: Icon, to, hint }: {
  title: string; value?: number | string; loading?: boolean; icon: LucideIcon; to?: string; hint?: string
}) {
  const body = (
    <Card className="h-full transition-colors hover:ring-blue-400/30">
      <CardContent>
        <div className="mb-5 flex items-center justify-between">
          <p className="etiqueta">{title}</p>
          <span className="flex size-9 items-center justify-center rounded-lg bg-[#162238] text-blue-300 ring-1 ring-white/10">
            <Icon className="size-4" />
          </span>
        </div>
        {loading ? <Skeleton className="h-9 w-16" /> : <p className="mono text-4xl font-semibold tracking-tight">{value ?? '—'}</p>}
        {hint && <p className="mono mt-2 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
  return to ? <Link to={to}>{body}</Link> : body
}

function Atencion({ sinConexion, loading }: { sinConexion: number; loading: boolean }) {
  const mal = sinConexion > 0
  return (
    <Link to="/dispositivos">
      <Card className={`h-full transition-colors ${mal ? 'bg-gradient-to-br from-amber-500/10 to-card ring-amber-400/25 hover:ring-amber-400/50' : 'hover:ring-emerald-400/30'}`}>
        <CardContent>
          <div className="mb-5 flex items-center justify-between">
            <p className={`etiqueta flex items-center gap-2 ${mal ? 'text-amber-300' : 'text-emerald-300'}`}>
              <span className="size-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
              {mal ? 'Atención requerida' : 'Sin incidencias'}
            </p>
            <span className={`flex size-9 items-center justify-center rounded-lg ring-1 ${mal ? 'bg-amber-400/10 text-amber-300 ring-amber-400/25' : 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/25'}`}>
              {mal ? <AlertTriangle className="size-4" /> : <CheckCircle2 className="size-4" />}
            </span>
          </div>
          {loading ? (
            <Skeleton className="h-9 w-16" />
          ) : (
            <p className="text-4xl font-semibold tracking-tight">
              <span className="mono">{sinConexion}</span>
              <span className="ml-2 text-base font-normal text-muted-foreground">sin conexión</span>
            </p>
          )}
          <p className="mono mt-2 flex items-center justify-between text-xs text-muted-foreground">
            {mal ? 'Revisa estas pantallas' : 'Todas las pantallas responden'} <ArrowRight className="size-3.5" />
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}

function Panel({ title, description, children, to, icon: Icon, className }: {
  title: string; description?: string; children: ReactNode; to?: string; icon?: LucideIcon; className?: string
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              {Icon && <Icon className="size-4 text-blue-300" />}
              {title}
            </CardTitle>
            {description && <CardDescription className="etiqueta mt-1">{description}</CardDescription>}
          </div>
          {to && (
            <Link to={to} className="mono flex shrink-0 items-center gap-1 text-xs text-blue-300 hover:text-blue-200">
              Ver todo <ArrowRight className="size-3.5" />
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function Vacio({ text }: { text: string }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{text}</p>
}

/* Estado de la red de pantallas: barra segmentada con datos reales */
function EstadoRed({ dispositivos, total, loading }: { dispositivos?: Row[]; total?: number; loading: boolean }) {
  const por = contar(dispositivos ?? [], 'estado')
  const n = dispositivos?.length ?? 0
  const filas = [
    { k: 'ACTIVO', label: 'Activas', color: '#10b981' },
    { k: 'SIN_CONEXION', label: 'Sin conexión', color: '#f59e0b' },
    { k: 'INACTIVO', label: 'Inactivas', color: '#64748b' },
  ]
  return (
    <Card className="lg:col-span-2">
      <CardContent>
        {loading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <>
            <p className="etiqueta flex items-center gap-2">
              <span className="size-1.5 animate-[pulse-dot_1.6s_infinite] rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              Estado de la red de pantallas
            </p>
            <p className="mt-3 flex items-baseline gap-3">
              <span className="mono text-5xl font-semibold tracking-tight">{total ?? 0}</span>
              <span className="etiqueta">pantallas registradas</span>
            </p>
            <div className="mt-6 flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-white/[0.06]">
              {filas.map((f) => (
                <div
                  key={f.k}
                  className="h-full transition-[width] duration-700"
                  style={{ width: pct(por[f.k] ?? 0, n), background: f.color, boxShadow: `0 0 10px ${f.color}66` }}
                />
              ))}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {filas.map((f) => (
                <div key={f.k} className="rounded-lg border border-white/[0.06] bg-[#070d18] p-3">
                  <p className="etiqueta flex items-center gap-2 text-foreground/80">
                    <span className="size-1.5 rounded-full" style={{ background: f.color, boxShadow: `0 0 8px ${f.color}` }} />
                    {f.label}
                  </p>
                  <p className="mt-2 flex items-baseline gap-2">
                    <span className="mono text-2xl font-semibold" style={{ color: f.color }}>{por[f.k] ?? 0}</span>
                    <span className="mono text-xs text-muted-foreground">({pct(por[f.k] ?? 0, n)})</span>
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function Pantallas({ dispositivos, loading, titulo = 'Última actividad' }: { dispositivos?: Row[]; loading: boolean; titulo?: string }) {
  const lista = [...(dispositivos ?? [])]
    .sort((a, b) => (b.ultima_conexion ?? '').localeCompare(a.ultima_conexion ?? ''))
    .slice(0, 5)
  return (
    <Panel title={titulo} description="Última conexión por pantalla" to="/dispositivos" icon={Radio}>
      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : lista.length === 0 ? (
        <Vacio text="No hay dispositivos registrados." />
      ) : (
        <ul className="grid gap-2">
          {lista.map((d) => {
            const c = ESTADO_COLOR[d.estado] ?? '#94a3b8'
            return (
              <li
                key={d.id_dispositivo}
                className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.05] bg-[#070d18] px-3 py-2.5"
                style={d.estado === 'SIN_CONEXION' ? { borderColor: c + '40', background: c + '12' } : undefined}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="size-2 shrink-0 rounded-full" style={{ background: c, boxShadow: `0 0 8px ${c}` }} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{d.nombre}</p>
                    <p className="mono truncate text-[0.68rem] text-muted-foreground">
                      {d.ubicacion ? `${d.ubicacion} · ` : ''}{hace(d.ultima_conexion)}
                    </p>
                  </div>
                </div>
                <Pill value={d.estado} text={ESTADO_DISPOSITIVO[d.estado] ?? d.estado} />
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}

function ProyectosPorEstado({ proyectos, loading, total }: { proyectos?: Row[]; loading: boolean; total?: number }) {
  const por = contar(proyectos ?? [], 'estado')
  const max = Math.max(1, ...Object.values(por))
  return (
    <Panel
      title="Proyectos por estado del ciclo de vida"
      description={`${total ?? 0} proyectos en total`}
      to="/proyectos"
      icon={FolderKanban}
      className="lg:col-span-3"
    >
      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <ul className="grid gap-2.5">
          {Object.keys(ESTADO_PROYECTO).map((estado, i) => {
            const n = por[estado] ?? 0
            const c = ESTADO_COLOR[estado] ?? '#94a3b8'
            return (
              <li key={estado} className={`grid grid-cols-[9rem_1fr_2rem] items-center gap-3 text-sm ${n ? '' : 'opacity-45'}`}>
                <span className="flex items-center gap-2 truncate">
                  <span className="size-2 rounded-[3px]" style={{ background: c }} />
                  <span className="mono text-xs text-muted-foreground">{i + 1}.</span> {ESTADO_PROYECTO[estado]}
                </span>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full transition-[width] duration-700"
                    style={{ width: `${(n / max) * 100}%`, background: `linear-gradient(90deg, ${c}99, ${c})`, boxShadow: `0 0 10px ${c}55` }}
                  />
                </div>
                <span className="mono text-right font-medium">{n}</span>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}

function ProximasEntregas({ proyectos, loading }: { proyectos?: Row[]; loading: boolean }) {
  const proximos = (proyectos ?? [])
    .filter((p) => !FINALIZADOS.includes(p.estado))
    .sort((a, b) => parseFecha(a.fecha_entrega).getTime() - parseFecha(b.fecha_entrega).getTime())
    .slice(0, 5)
  return (
    <Panel title="Próximas entregas" description="Proyectos sin cerrar" to="/proyectos" icon={Clock} className="lg:col-span-2">
      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : proximos.length === 0 ? (
        <Vacio text="No hay entregas pendientes." />
      ) : (
        <ul className="grid gap-2">
          {proximos.map((p) => {
            const d = diasHasta(p.fecha_entrega)
            const tono = d < 0 ? 'rojo' : d <= 7 ? 'ambar' : 'normal'
            return (
              <li
                key={p.id_proyecto}
                className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm ${
                  tono === 'rojo' ? 'border-red-400/25 bg-red-500/10' : tono === 'ambar' ? 'border-amber-400/25 bg-amber-400/10' : 'border-white/[0.05] bg-[#070d18]'
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.nombre}</p>
                  <p className="mono text-[0.68rem] text-muted-foreground">{parseFecha(p.fecha_entrega).toLocaleDateString('es')}</p>
                </div>
                <span
                  className={`mono flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[0.68rem] font-medium uppercase ${
                    tono === 'rojo' ? 'bg-red-500/20 text-red-300' : tono === 'ambar' ? 'bg-amber-400/15 text-amber-300' : 'bg-blue-400/10 text-blue-300'
                  }`}
                >
                  {d < 0 ? <><AlertTriangle className="size-3" /> Vencido hace {Math.abs(d)} d</> : d === 0 ? 'Hoy' : `En ${d} d`}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}

function Equipo({ usuarios, total, loading }: { usuarios?: Row[]; total?: number; loading: boolean }) {
  const por = contar(usuarios ?? [], 'rol')
  const n = usuarios?.length ?? 0
  const roles = Object.entries(por)
  let acum = 0
  const tramos = roles.map(([rol, c]) => {
    const ini = acum
    acum += (c / Math.max(1, n)) * 360
    return `${ESTADO_COLOR[rol] ?? '#94a3b8'} ${ini}deg ${acum}deg`
  })
  return (
    <Panel title="Usuarios por rol" description={`Total: ${total ?? 0}`} to="/usuarios" icon={Users} className="lg:col-span-2">
      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : n === 0 ? (
        <Vacio text="Sin usuarios." />
      ) : (
        <div className="flex items-center gap-5">
          <div
            className="relative size-28 shrink-0 rounded-full"
            style={{ background: `conic-gradient(${tramos.join(', ')})` }}
          >
            <div className="absolute inset-[10px] flex flex-col items-center justify-center rounded-full bg-card">
              <span className="mono text-2xl font-semibold">{total ?? n}</span>
              <span className="etiqueta text-[0.58rem]">usuarios</span>
            </div>
          </div>
          <ul className="grid flex-1 gap-2 text-sm">
            {roles.map(([rol, c]) => (
              <li key={rol} className="flex items-center justify-between gap-2">
                <Pill value={rol} text={ROL_LABEL[rol as keyof typeof ROL_LABEL] ?? rol} />
                <span className="mono text-xs">{c} <span className="text-muted-foreground">({pct(c, n)})</span></span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  )
}

const activos = (p?: Row[]) => (p ?? []).filter((x) => !FINALIZADOS.includes(x.estado)).length
const sinConexion = (d?: Row[]) => (d ?? []).filter((x) => x.estado === 'SIN_CONEXION').length

/* ---------- Vistas por rol ---------- */

function DashboardAdministrador() {
  const proyectos = useList('proyectos', { page_size: 100, ordering: 'fecha_entrega' })
  const dispositivos = useList('dispositivos', { page_size: 100 })
  const usuarios = useList('usuarios', { page_size: 100 })
  const clientes = useCount('clientes')

  return (
    <>
      <div className="aparecer grid gap-4 lg:grid-cols-3">
        <EstadoRed dispositivos={dispositivos.data?.results} total={dispositivos.data?.count} loading={dispositivos.isLoading} />
        <Pantallas dispositivos={dispositivos.data?.results} loading={dispositivos.isLoading} />
      </div>
      <div className="aparecer grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat title="Empresas clientes" icon={Building2} to="/clientes" loading={clientes.loading} value={clientes.value} />
        <Stat title="Usuarios del sistema" icon={Users} to="/usuarios" loading={usuarios.isLoading} value={usuarios.data?.count} />
        <Stat title="Proyectos en curso" icon={FolderKanban} to="/proyectos" loading={proyectos.isLoading}
          value={activos(proyectos.data?.results)} hint={`De ${proyectos.data?.count ?? 0} en la plataforma`} />
        <Atencion sinConexion={sinConexion(dispositivos.data?.results)} loading={dispositivos.isLoading} />
      </div>
      <div className="aparecer grid gap-4 lg:grid-cols-5">
        <ProyectosPorEstado proyectos={proyectos.data?.results} total={proyectos.data?.count} loading={proyectos.isLoading} />
        <div className="grid gap-4 lg:col-span-2 lg:content-start">
          <ProximasEntregas proyectos={proyectos.data?.results} loading={proyectos.isLoading} />
          <Equipo usuarios={usuarios.data?.results} total={usuarios.data?.count} loading={usuarios.isLoading} />
        </div>
      </div>
    </>
  )
}

function DashboardAdminCliente() {
  const proyectos = useList('proyectos', { page_size: 100, ordering: 'fecha_entrega' })
  const dispositivos = useList('dispositivos', { page_size: 100 })
  const archivos = useCount('archivos')
  const usuarios = useCount('usuarios')

  return (
    <>
      <div className="aparecer grid gap-4 lg:grid-cols-3">
        <EstadoRed dispositivos={dispositivos.data?.results} total={dispositivos.data?.count} loading={dispositivos.isLoading} />
        <Pantallas dispositivos={dispositivos.data?.results} loading={dispositivos.isLoading} titulo="Mis pantallas" />
      </div>
      <div className="aparecer grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat title="Proyectos en curso" icon={FolderKanban} to="/proyectos" loading={proyectos.isLoading}
          value={activos(proyectos.data?.results)} hint={`${proyectos.data?.count ?? 0} en total`} />
        <Stat title="Archivos" icon={FileVideo} to="/archivos" loading={archivos.loading} value={archivos.value} />
        <Stat title="Mi equipo" icon={Users} to="/usuarios" loading={usuarios.loading} value={usuarios.value} hint="Usuarios de tu empresa" />
        <Atencion sinConexion={sinConexion(dispositivos.data?.results)} loading={dispositivos.isLoading} />
      </div>
      <div className="aparecer grid gap-4 lg:grid-cols-5">
        <ProyectosPorEstado proyectos={proyectos.data?.results} total={proyectos.data?.count} loading={proyectos.isLoading} />
        <ProximasEntregas proyectos={proyectos.data?.results} loading={proyectos.isLoading} />
      </div>
    </>
  )
}

function DashboardCliente() {
  const proyectos = useList('proyectos', { page_size: 100, ordering: 'fecha_entrega' })
  const dispositivos = useList('dispositivos', { page_size: 100 })
  const archivos = useCount('archivos')

  return (
    <>
      <div className="aparecer grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat title="Mis proyectos" icon={FolderKanban} to="/proyectos" loading={proyectos.isLoading}
          value={proyectos.data?.count} hint={`${activos(proyectos.data?.results)} en curso`} />
        <Stat title="Mis pantallas" icon={MonitorSmartphone} to="/dispositivos" loading={dispositivos.isLoading} value={dispositivos.data?.count} />
        <Stat title="Archivos" icon={FileVideo} to="/archivos" loading={archivos.loading} value={archivos.value} />
        <Atencion sinConexion={sinConexion(dispositivos.data?.results)} loading={dispositivos.isLoading} />
      </div>
      <div className="aparecer grid gap-4 lg:grid-cols-5">
        <ProximasEntregas proyectos={proyectos.data?.results} loading={proyectos.isLoading} />
        <div className="lg:col-span-3">
          <Pantallas dispositivos={dispositivos.data?.results} loading={dispositivos.isLoading} titulo="Mis pantallas" />
        </div>
      </div>
    </>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  if (!user) return null
  return (
    <div className="space-y-4">
      <Card>
        <CardContent>
          <p className="etiqueta flex flex-wrap items-center gap-x-2">
            <span className="size-1.5 animate-[pulse-dot_1.6s_infinite] rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <span className="text-emerald-300">Sesión activa</span>
            <span className="text-white/20">/</span>
            <span>Rol: {ROL_LABEL[user.rol]}</span>
            <span className="text-white/20">·</span>
            <span>{new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Hola, {user.first_name || user.username}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {user.rol === 'ADMINISTRADOR'
              ? 'Vista general de toda la plataforma.'
              : user.rol === 'ADMINISTRADOR_CLIENTE'
                ? 'Resumen de tu empresa: proyectos, pantallas y equipo.'
                : 'Resumen de tus proyectos y pantallas.'}
          </p>
        </CardContent>
      </Card>
      {user.rol === 'ADMINISTRADOR' ? <DashboardAdministrador /> : user.rol === 'ADMINISTRADOR_CLIENTE' ? <DashboardAdminCliente /> : <DashboardCliente />}
    </div>
  )
}
