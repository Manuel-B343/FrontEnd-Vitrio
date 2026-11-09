import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, Building2, FileVideo, FolderKanban, MonitorSmartphone, Users, type LucideIcon,
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

/* ---------- Piezas ---------- */

function Stat({ title, value, loading, icon: Icon, to, hint }: {
  title: string; value?: number | string; loading?: boolean; icon: LucideIcon; to?: string; hint?: string
}) {
  const body = (
    <Card className="h-full transition-colors hover:bg-muted/50">
      <CardContent>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <Icon className="size-4 text-blue-400" />
        </div>
        {loading ? <Skeleton className="h-8 w-14" /> : <p className="text-3xl font-semibold">{value ?? '—'}</p>}
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
  return to ? <Link to={to}>{body}</Link> : body
}

function Panel({ title, description, children, to }: { title: string; description?: string; children: ReactNode; to?: string }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {to && (
            <Link to={to} className="text-xs text-blue-400 hover:underline">
              Ver todo
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

function Barras({ datos, etiquetas }: { datos: Record<string, number>; etiquetas: Record<string, string> }) {
  const entradas = Object.entries(datos).sort((a, b) => b[1] - a[1])
  const max = Math.max(1, ...entradas.map(([, n]) => n))
  if (!entradas.length) return <Vacio text="Sin datos todavía." />
  return (
    <ul className="grid gap-3">
      {entradas.map(([estado, n]) => (
        <li key={estado} className="grid gap-1.5">
          <div className="flex items-center justify-between text-sm">
            <span>{etiquetas[estado] ?? estado}</span>
            <span className="font-medium tabular-nums">{n}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full"
              style={{ width: `${(n / max) * 100}%`, background: ESTADO_COLOR[estado] ?? '#94a3b8' }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

function ProyectosPorEstado({ proyectos, loading }: { proyectos?: Row[]; loading: boolean }) {
  return (
    <Panel title="Proyectos por estado" to="/proyectos">
      {loading ? <Skeleton className="h-32 w-full" /> : <Barras datos={contar(proyectos ?? [], 'estado')} etiquetas={ESTADO_PROYECTO} />}
    </Panel>
  )
}

function ProximasEntregas({ proyectos, loading }: { proyectos?: Row[]; loading: boolean }) {
  const proximos = (proyectos ?? [])
    .filter((p) => !FINALIZADOS.includes(p.estado))
    .sort((a, b) => parseFecha(a.fecha_entrega).getTime() - parseFecha(b.fecha_entrega).getTime())
    .slice(0, 5)
  return (
    <Panel title="Próximas entregas" description="Proyectos sin cerrar, por fecha de entrega" to="/proyectos">
      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : proximos.length === 0 ? (
        <Vacio text="No hay entregas pendientes." />
      ) : (
        <ul className="divide-y divide-white/[0.06]">
          {proximos.map((p) => {
            const d = diasHasta(p.fecha_entrega)
            return (
              <li key={p.id_proyecto} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.nombre}</p>
                  <p className="text-xs text-muted-foreground">{parseFecha(p.fecha_entrega).toLocaleDateString('es')}</p>
                </div>
                {d < 0 ? (
                  <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-red-400">
                    <AlertTriangle className="size-3.5" /> Vencido hace {Math.abs(d)} d
                  </span>
                ) : (
                  <span className={`shrink-0 text-xs font-semibold ${d <= 7 ? 'text-amber-400' : 'text-muted-foreground'}`}>
                    {d === 0 ? 'Hoy' : `En ${d} d`}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}

function Pantallas({ dispositivos, loading, titulo = 'Pantallas' }: { dispositivos?: Row[]; loading: boolean; titulo?: string }) {
  const lista = [...(dispositivos ?? [])]
    .sort((a, b) => (b.ultima_conexion ?? '').localeCompare(a.ultima_conexion ?? ''))
    .slice(0, 6)
  return (
    <Panel title={titulo} description="Última conexión de cada dispositivo" to="/dispositivos">
      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : lista.length === 0 ? (
        <Vacio text="No hay dispositivos registrados." />
      ) : (
        <ul className="divide-y divide-white/[0.06]">
          {lista.map((d) => (
            <li key={d.id_dispositivo} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{d.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {d.ubicacion ? `${d.ubicacion} · ` : ''}
                  {hace(d.ultima_conexion)}
                </p>
              </div>
              <Pill value={d.estado} text={ESTADO_DISPOSITIVO[d.estado] ?? d.estado} />
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

function EstadoPantallas({ dispositivos, loading }: { dispositivos?: Row[]; loading: boolean }) {
  return (
    <Panel title="Dispositivos por estado" to="/dispositivos">
      {loading ? <Skeleton className="h-32 w-full" /> : <Barras datos={contar(dispositivos ?? [], 'estado')} etiquetas={ESTADO_DISPOSITIVO} />}
    </Panel>
  )
}

function Equipo({ usuarios, loading }: { usuarios?: Row[]; loading: boolean }) {
  const por = contar(usuarios ?? [], 'rol')
  return (
    <Panel title="Usuarios por rol" to="/usuarios">
      {loading ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <ul className="grid gap-2.5 text-sm">
          {Object.entries(por).map(([rol, n]) => (
            <li key={rol} className="flex items-center justify-between">
              <Pill value={rol} text={ROL_LABEL[rol as keyof typeof ROL_LABEL] ?? rol} />
              <span className="font-medium tabular-nums">{n}</span>
            </li>
          ))}
          {!usuarios?.length && <Vacio text="Sin usuarios." />}
        </ul>
      )}
    </Panel>
  )
}

const activos = (p?: Row[]) => (p ?? []).filter((x) => !FINALIZADOS.includes(x.estado)).length

/* ---------- Vistas por rol ---------- */

function DashboardAdministrador() {
  const proyectos = useList('proyectos', { page_size: 100, ordering: 'fecha_entrega' })
  const dispositivos = useList('dispositivos', { page_size: 100 })
  const usuarios = useList('usuarios', { page_size: 100 })
  const clientes = useCount('clientes')
  const sinConexion = (dispositivos.data?.results ?? []).filter((d) => d.estado === 'SIN_CONEXION').length

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat title="Clientes" icon={Building2} to="/clientes" loading={clientes.loading} value={clientes.value} />
        <Stat title="Usuarios" icon={Users} to="/usuarios" loading={usuarios.isLoading} value={usuarios.data?.count} />
        <Stat title="Proyectos en curso" icon={FolderKanban} to="/proyectos" loading={proyectos.isLoading}
          value={activos(proyectos.data?.results)} hint={`${proyectos.data?.count ?? 0} en total`} />
        <Stat title="Dispositivos" icon={MonitorSmartphone} to="/dispositivos" loading={dispositivos.isLoading}
          value={dispositivos.data?.count} hint={sinConexion ? `${sinConexion} sin conexión` : 'Todos con conexión'} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ProyectosPorEstado proyectos={proyectos.data?.results} loading={proyectos.isLoading} />
        <ProximasEntregas proyectos={proyectos.data?.results} loading={proyectos.isLoading} />
        <EstadoPantallas dispositivos={dispositivos.data?.results} loading={dispositivos.isLoading} />
        <Equipo usuarios={usuarios.data?.results} loading={usuarios.isLoading} />
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat title="Proyectos en curso" icon={FolderKanban} to="/proyectos" loading={proyectos.isLoading}
          value={activos(proyectos.data?.results)} hint={`${proyectos.data?.count ?? 0} en total`} />
        <Stat title="Dispositivos" icon={MonitorSmartphone} to="/dispositivos" loading={dispositivos.isLoading} value={dispositivos.data?.count} />
        <Stat title="Archivos" icon={FileVideo} to="/archivos" loading={archivos.loading} value={archivos.value} />
        <Stat title="Mi equipo" icon={Users} to="/usuarios" loading={usuarios.loading} value={usuarios.value} hint="Usuarios de tu empresa" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ProyectosPorEstado proyectos={proyectos.data?.results} loading={proyectos.isLoading} />
        <ProximasEntregas proyectos={proyectos.data?.results} loading={proyectos.isLoading} />
        <Pantallas dispositivos={dispositivos.data?.results} loading={dispositivos.isLoading} titulo="Mis pantallas" />
        <EstadoPantallas dispositivos={dispositivos.data?.results} loading={dispositivos.isLoading} />
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
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat title="Mis proyectos" icon={FolderKanban} to="/proyectos" loading={proyectos.isLoading}
          value={proyectos.data?.count} hint={`${activos(proyectos.data?.results)} en curso`} />
        <Stat title="Mis pantallas" icon={MonitorSmartphone} to="/dispositivos" loading={dispositivos.isLoading} value={dispositivos.data?.count} />
        <Stat title="Archivos" icon={FileVideo} to="/archivos" loading={archivos.loading} value={archivos.value} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ProximasEntregas proyectos={proyectos.data?.results} loading={proyectos.isLoading} />
        <Pantallas dispositivos={dispositivos.data?.results} loading={dispositivos.isLoading} titulo="Mis pantallas" />
      </div>
    </>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  if (!user) return null
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hola, {user.first_name || user.username}</h1>
        <p className="text-sm text-muted-foreground">
          {user.rol === 'ADMINISTRADOR'
            ? 'Vista general de toda la plataforma.'
            : user.rol === 'ADMINISTRADOR_CLIENTE'
              ? 'Resumen de tu empresa: proyectos, pantallas y equipo.'
              : 'Resumen de tus proyectos y pantallas.'}
        </p>
      </div>
      {user.rol === 'ADMINISTRADOR' ? <DashboardAdministrador /> : user.rol === 'ADMINISTRADOR_CLIENTE' ? <DashboardAdminCliente /> : <DashboardCliente />}
    </div>
  )
}
