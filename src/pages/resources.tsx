import { useState, type ReactNode } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Copy } from 'lucide-react'
import { api, fieldErrors, type Page } from '@/lib/api'
import { ROL_LABEL, type Perfil, type Rol } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ResourcePage, type Field, type ResourceConfig } from '@/components/resource-page'

type Row = Record<string, any>

const isAdmin = (u: Perfil) => u.rol === 'ADMINISTRADOR'
const canManage = (u: Perfil) => u.rol !== 'CLIENTE'

const fecha = (v?: string | null) => {
  if (!v) return '—'
  // Las fechas sin hora se interpretan como locales para no desplazarlas un dia.
  const d = /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T00:00:00`) : new Date(v)
  return d.toLocaleDateString('es')
}
const fechaHora = (v?: string | null) => (v ? new Date(v).toLocaleString('es') : '—')
const dash = (v: unknown) => (v === null || v === undefined || v === '' ? '—' : String(v))

const opts = (pairs: [string, string][]) => pairs.map(([value, label]) => ({ value, label }))

const ESTADO_PROYECTO = opts([
  ['PROPUESTO', 'Propuesto'], ['ANALISIS', 'Análisis'], ['APROBADO', 'Aprobado'], ['PLANIFICACION', 'Planificación'],
  ['EJECUCION', 'Ejecución'], ['SEGUIMIENTO', 'Seguimiento'], ['PAUSADO', 'Pausado'], ['CANCELADO', 'Cancelado'],
])
const TIPO_PLANTILLA = opts([
  ['VIDEO', 'Video'], ['IMAGEN', 'Imagen'], ['AUDIO', 'Audio'], ['METADATO', 'Metadato'], ['DOCUMENTO', 'Documento'],
])
const TIPO_ARCHIVO = [...TIPO_PLANTILLA.slice(0, 3), { value: 'PAQUETE', label: 'Paquete' }, ...TIPO_PLANTILLA.slice(3)]
const ESTADO_PLANTILLA = opts([['ACTIVA', 'Activa'], ['INACTIVA', 'Inactiva'], ['DEPRECADA', 'Deprecada']])
const ESTADO_DISPOSITIVO = opts([['ACTIVO', 'Activo'], ['INACTIVO', 'Inactivo'], ['SIN_CONEXION', 'Sin conexión']])
const label = (list: { value: string; label: string }[], v: string) => list.find((o) => o.value === v)?.label ?? v

const BADGE: Record<string, string> = {
  PROPUESTO: '#94a3b8', ANALISIS: '#fbbf24', APROBADO: '#34d399', PLANIFICACION: '#60a5fa', EJECUCION: '#3b82f6',
  SEGUIMIENTO: '#a78bfa', PAUSADO: '#fbbf24', CANCELADO: '#f87171', ACTIVA: '#34d399', INACTIVA: '#f87171',
  DEPRECADA: '#64748b', ACTIVO: '#34d399', INACTIVO: '#f87171', SIN_CONEXION: '#fbbf24',
  ADMINISTRADOR: '#818cf8', ADMINISTRADOR_CLIENTE: '#a78bfa', CLIENTE: '#60a5fa',
}

function Pill({ value, text }: { value: string; text: string }) {
  const c = BADGE[value] ?? '#94a3b8'
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
      style={{ color: c, background: c + '26', borderColor: c + '4d' }}
    >
      {text}
    </span>
  )
}

function EstadoBadge({ value, list }: { value: string; list: { value: string; label: string }[] }) {
  return <Pill value={value} text={label(list, value)} />
}

const relCliente = {
  path: 'clientes', idKey: 'id_cliente', label: (r: Row) => r.nombre,
}
const relProyecto = {
  path: 'proyectos', idKey: 'id_proyecto', label: (r: Row) => r.nombre,
}

/* ---------- Diálogos auxiliares ---------- */

function TokenDialog({ token, nombre, onClose }: { token: string; nombre: string; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Token del dispositivo</DialogTitle>
          <DialogDescription>
            Copia el token de «{nombre}» ahora: no se puede volver a consultar. Si lo pierdes, rota el token.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Input readOnly value={token} className="font-mono text-xs" onFocus={(e) => e.target.select()} />
          <Button
            variant="outline"
            size="icon"
            aria-label="Copiar"
            onClick={() => navigator.clipboard.writeText(token).then(() => toast.success('Token copiado'))}
          >
            <Copy />
          </Button>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Listo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ResetPasswordDialog({ user, onClose }: { user: Row; onClose: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const m = useMutation({
    mutationFn: () => api(`/usuarios/${user.id_usuario}/restablecer-password/`, { method: 'POST', body: { password } }),
    onSuccess: () => {
      toast.success('Contraseña restablecida; sus sesiones se cerraron')
      onClose()
    },
    onError: (e) => setError(fieldErrors(e).password ?? (e as Error).message),
  })
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restablecer contraseña</DialogTitle>
          <DialogDescription>Nueva contraseña para {user.username}. Mínimo 10 caracteres.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            setError('')
            m.mutate()
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="np">Nueva contraseña</Label>
            <Input id="np" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={m.isPending || !password}>Restablecer</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EventosDialog({ device, onClose }: { device: Row; onClose: () => void }) {
  const [page, setPage] = useState(1)
  const { data, isLoading, error } = useQuery({
    queryKey: ['eventos', device.id_dispositivo, page],
    queryFn: () => api<Page<Row>>(`/dispositivos/${device.id_dispositivo}/eventos/`, { params: { page, page_size: 10 } }),
  })
  const pages = Math.max(1, Math.ceil((data?.count ?? 0) / 10))
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Eventos de {device.nombre}</DialogTitle>
          <DialogDescription>Historial de eventos reportados por el dispositivo.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[50vh] overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Datos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Cargando…</TableCell></TableRow>
              ) : error ? (
                <TableRow><TableCell colSpan={3} className="text-center text-destructive">{(error as Error).message}</TableCell></TableRow>
              ) : data?.results.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Sin eventos.</TableCell></TableRow>
              ) : (
                data?.results.map((e) => (
                  <TableRow key={e.id_evento}>
                    <TableCell className="whitespace-nowrap">{fechaHora(e.fecha_creacion)}</TableCell>
                    <TableCell><Badge variant="outline">{e.tipo}</Badge></TableCell>
                    <TableCell className="max-w-xs truncate font-mono text-xs">{JSON.stringify(e.datos)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <DialogFooter className="sm:justify-between">
          <span className="self-center text-sm text-muted-foreground">Página {page} de {pages}</span>
          <div className="flex gap-2">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
            <Button variant="outline" disabled={page >= pages} onClick={() => setPage(page + 1)}>Siguiente</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ---------- Configuraciones ---------- */

const rolOptions = (ctx: { user: Perfil }) =>
  opts(
    (Object.keys(ROL_LABEL) as Rol[])
      .filter((r) => isAdmin(ctx.user) || r !== 'ADMINISTRADOR')
      .map((r) => [r, ROL_LABEL[r]] as [string, string]),
  )

const clientes: ResourceConfig = {
  path: 'clientes', title: 'Clientes', singular: 'cliente', idKey: 'id_cliente',
  description: 'Empresas u organizaciones que contratan proyectos.',
  canWrite: isAdmin,
  fields: [
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'telefono', label: 'Teléfono', type: 'text', required: true, hint: 'Ej. +34 600 123 456' },
  ],
  columns: [
    { header: 'Nombre', sort: 'nombre', render: (r) => <span className="font-medium">{r.nombre}</span> },
    { header: 'Email', render: (r) => r.email },
    { header: 'Teléfono', render: (r) => r.telefono },
    { header: 'Creado', sort: 'fecha_creacion', render: (r) => fecha(r.fecha_creacion) },
  ],
}

const usuarios: ResourceConfig = {
  path: 'usuarios', title: 'Usuarios', singular: 'usuario', idKey: 'id_usuario',
  description: 'Cuentas con acceso al panel. Eliminar un usuario lo desactiva.',
  canWrite: canManage,
  deleteNote: 'El usuario quedará desactivado y se cerrarán sus sesiones.',
  defaultValues: (u) => ({ rol: 'CLIENTE', id_cliente: u.rol === 'ADMINISTRADOR_CLIENTE' && u.id_cliente ? String(u.id_cliente) : '' }),
  fields: [
    { name: 'username', label: 'Usuario', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'password', label: 'Contraseña', type: 'password', required: true, createOnly: true, hint: 'Mínimo 10 caracteres, no común ni solo numérica.' },
    { name: 'first_name', label: 'Nombre', type: 'text' },
    { name: 'last_name', label: 'Apellidos', type: 'text' },
    { name: 'fecha_nacimiento', label: 'Fecha de nacimiento', type: 'date', nullable: true },
    { name: 'rol', label: 'Rol', type: 'select', required: true, options: rolOptions },
    {
      name: 'id_cliente', label: 'Cliente', type: 'relation', relation: relCliente, required: true,
      hide: ({ user, values }) => values.rol === 'ADMINISTRADOR' || user.rol === 'ADMINISTRADOR_CLIENTE',
    },
  ],
  columns: [
    { header: 'Usuario', sort: 'username', render: (r) => <span className="font-medium">{r.username}</span> },
    { header: 'Nombre', render: (r) => dash(`${r.first_name ?? ''} ${r.last_name ?? ''}`.trim()) },
    { header: 'Email', render: (r) => r.email },
    { header: 'Rol', render: (r) => <Pill value={r.rol} text={ROL_LABEL[r.rol as Rol] ?? r.rol} /> },
    { header: 'Estado', render: (r) => <Pill value={r.is_active ? 'ACTIVO' : 'INACTIVO'} text={r.is_active ? 'Activo' : 'Inactivo'} /> },
    { header: 'Último acceso', render: (r) => fechaHora(r.last_login) },
  ],
  rowActions: (row, h) => [
    { label: 'Restablecer contraseña', onClick: () => h.show(<ResetPasswordDialog user={row} onClose={() => h.show(null)} />) },
  ],
}

const proyectos: ResourceConfig = {
  path: 'proyectos', title: 'Proyectos', singular: 'proyecto', idKey: 'id_proyecto',
  description: 'Proyectos de cartelería digital y su ciclo de vida.',
  canWrite: canManage,
  defaultValues: () => ({ estado: 'PROPUESTO' }),
  fields: [
    {
      name: 'id_cliente', label: 'Cliente', type: 'relation', relation: relCliente, required: true,
      createOnly: true, hide: ({ user }) => user.rol === 'ADMINISTRADOR_CLIENTE',
    },
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'descripcion', label: 'Descripción', type: 'textarea', required: true },
    { name: 'fecha_inicio', label: 'Fecha de inicio', type: 'date', required: true },
    { name: 'fecha_entrega', label: 'Fecha de entrega', type: 'date', required: true },
    { name: 'estado', label: 'Estado', type: 'select', options: ESTADO_PROYECTO },
  ],
  columns: [
    { header: 'Nombre', sort: 'nombre', render: (r) => <span className="font-medium">{r.nombre}</span> },
    { header: 'Estado', sort: 'estado', render: (r) => <EstadoBadge value={r.estado} list={ESTADO_PROYECTO} /> },
    { header: 'Inicio', sort: 'fecha_inicio', render: (r) => fecha(r.fecha_inicio) },
    { header: 'Entrega', sort: 'fecha_entrega', render: (r) => fecha(r.fecha_entrega) },
  ],
}

const plantillas: ResourceConfig = {
  path: 'plantillas', title: 'Plantillas', singular: 'plantilla', idKey: 'id_plantilla',
  description: 'Plantillas reutilizables de contenido.',
  canWrite: isAdmin,
  defaultValues: () => ({ estado: 'ACTIVA', version: '1.0' }),
  fields: [
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'descripcion', label: 'Descripción', type: 'textarea', nullable: true },
    { name: 'tipo', label: 'Tipo', type: 'select', required: true, options: TIPO_PLANTILLA },
    { name: 'version', label: 'Versión', type: 'text' },
    { name: 'estado', label: 'Estado', type: 'select', options: ESTADO_PLANTILLA },
    { name: 'ruta_base', label: 'Ruta base', type: 'text', nullable: true, hint: 'Ruta relativa (videos/a.mp4) o URL https://' },
    { name: 'esquema', label: 'Esquema (JSON)', type: 'json' },
  ],
  columns: [
    { header: 'Nombre', sort: 'nombre', render: (r) => <span className="font-medium">{r.nombre}</span> },
    { header: 'Tipo', sort: 'tipo', render: (r) => <Badge variant="outline">{label(TIPO_PLANTILLA, r.tipo)}</Badge> },
    { header: 'Versión', render: (r) => r.version },
    { header: 'Estado', sort: 'estado', render: (r) => <EstadoBadge value={r.estado} list={ESTADO_PLANTILLA} /> },
  ],
}

const archivos: ResourceConfig = {
  path: 'archivos', title: 'Archivos', singular: 'archivo', idKey: 'id_archivo',
  description: 'Contenidos asociados a los proyectos.',
  canWrite: canManage,
  fields: [
    { name: 'id_proyecto', label: 'Proyecto', type: 'relation', relation: relProyecto, required: true },
    {
      name: 'id_plantilla', label: 'Plantilla', type: 'relation', nullable: true,
      relation: { path: 'plantillas', idKey: 'id_plantilla', label: (r) => r.nombre },
    },
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'tipo', label: 'Tipo', type: 'select', required: true, options: TIPO_ARCHIVO },
    { name: 'ruta', label: 'Ruta', type: 'text', nullable: true, hint: 'Ruta relativa (videos/a.mp4) o URL https://' },
    { name: 'metadatos', label: 'Metadatos (JSON)', type: 'json' },
  ],
  columns: [
    { header: 'Nombre', sort: 'nombre', render: (r) => <span className="font-medium">{r.nombre}</span> },
    { header: 'Tipo', sort: 'tipo', render: (r) => <Badge variant="outline">{label(TIPO_ARCHIVO, r.tipo)}</Badge> },
    { header: 'Ruta', render: (r) => <span className="block max-w-xs truncate">{dash(r.ruta)}</span> },
    { header: 'Creado', sort: 'fecha_creacion', render: (r) => fecha(r.fecha_creacion) },
  ],
}

const dispositivos: ResourceConfig = {
  path: 'dispositivos', title: 'Dispositivos', singular: 'dispositivo', idKey: 'id_dispositivo',
  description: 'Pantallas que reproducen el contenido de un proyecto.',
  canWrite: canManage,
  defaultValues: () => ({ estado: 'ACTIVO' }),
  fields: [
    { name: 'id_proyecto', label: 'Proyecto', type: 'relation', relation: relProyecto, required: true },
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'ubicacion', label: 'Ubicación', type: 'text', nullable: true },
    { name: 'resolucion', label: 'Resolución', type: 'text', nullable: true, hint: 'Ej. 1920x1080' },
    { name: 'estado', label: 'Estado', type: 'select', options: ESTADO_DISPOSITIVO },
    { name: 'configuracion', label: 'Configuración (JSON)', type: 'json' },
  ],
  columns: [
    { header: 'Nombre', sort: 'nombre', render: (r) => <span className="font-medium">{r.nombre}</span> },
    { header: 'Ubicación', render: (r) => dash(r.ubicacion) },
    { header: 'Token', render: (r) => <code className="text-xs">{r.token_prefijo}…</code> },
    { header: 'Estado', sort: 'estado', render: (r) => <EstadoBadge value={r.estado} list={ESTADO_DISPOSITIVO} /> },
    { header: 'Última conexión', sort: 'ultima_conexion', render: (r) => fechaHora(r.ultima_conexion) },
  ],
  onSaved: (res, created, h) => {
    // El token solo viene en la respuesta de creación.
    if (created && res.token) h.show(<TokenDialog token={res.token} nombre={res.nombre} onClose={() => h.show(null)} />)
  },
  rowActions: (row, h, u) => [
    { label: 'Ver eventos', onClick: () => h.show(<EventosDialog device={row} onClose={() => h.show(null)} />) },
    ...(u.rol !== 'CLIENTE'
      ? [{
          label: 'Rotar token',
          onClick: () => {
            if (!window.confirm(`¿Rotar el token de «${row.nombre}»? El anterior dejará de funcionar.`)) return
            api<{ token: string }>(`/dispositivos/${row.id_dispositivo}/rotar-token/`, { method: 'POST' })
              .then((r) => {
                h.refresh()
                h.show(<TokenDialog token={r.token} nombre={row.nombre} onClose={() => h.show(null)} />)
              })
              .catch((e: Error) => toast.error(e.message))
          },
        }]
      : []),
  ],
}

export const RESOURCES: Record<string, ResourceConfig> = { clientes, usuarios, proyectos, plantillas, archivos, dispositivos }

export function ResourceRoute({ name }: { name: keyof typeof RESOURCES }): ReactNode {
  return <ResourcePage key={name} cfg={RESOURCES[name]} />
}

export type { Field }
