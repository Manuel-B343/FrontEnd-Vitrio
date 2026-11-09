import { useEffect, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, MoreHorizontal, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { api, ApiError, fieldErrors, type Page } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import type { Perfil } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { SelectField, type Option } from '@/components/select-field'

type Row = Record<string, any>
type Values = Record<string, string>
interface Ctx { user: Perfil; values: Values; editing: boolean }

export interface Field {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'date' | 'textarea' | 'select' | 'relation' | 'json'
  required?: boolean
  nullable?: boolean
  createOnly?: boolean
  options?: Option[] | ((ctx: Ctx) => Option[])
  relation?: { path: string; label: (r: Row) => string; idKey: string }
  hide?: (ctx: Ctx) => boolean
  hint?: string
}

export interface Column {
  header: string
  render: (row: Row) => ReactNode
  sort?: string
}

export interface RowAction { label: string; onClick: () => void }
export interface Helpers { refresh: () => void; show: (node: ReactNode | null) => void }

export interface ResourceConfig {
  path: string
  title: string
  singular: string
  idKey: string
  description?: string
  fields: Field[]
  columns: Column[]
  canWrite: (u: Perfil) => boolean
  canDelete?: (u: Perfil) => boolean
  defaultValues?: (u: Perfil) => Values
  deleteNote?: string
  rowActions?: (row: Row, h: Helpers, u: Perfil) => RowAction[]
  onSaved?: (result: Row, created: boolean, h: Helpers) => void
  /** Ajusta el cuerpo justo antes de enviarlo (por ejemplo, campos ocultos que el servidor exige). */
  prepareBody?: (body: Row, values: Values, user: Perfil) => Row
}

function useDebounced<T>(v: T, ms = 300) {
  const [d, setD] = useState(v)
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms)
    return () => clearTimeout(t)
  }, [v, ms])
  return d
}

const toText = (v: unknown) =>
  v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v)

function RelationSelect({ field, value, onChange, id }: { field: Field; value: string; onChange: (v: string) => void; id: string }) {
  const rel = field.relation!
  const { data, isLoading } = useQuery({
    queryKey: ['rel', rel.path],
    queryFn: () => api<Page<Row>>(`/${rel.path}/`, { params: { page_size: 100 } }),
    staleTime: 30_000,
  })
  const options = (data?.results ?? []).map((r) => ({ value: String(r[rel.idKey]), label: rel.label(r) }))
  return (
    <SelectField
      id={id}
      value={value}
      onChange={onChange}
      options={options}
      allowEmpty={!field.required}
      placeholder={isLoading ? 'Cargando…' : 'Seleccionar…'}
    />
  )
}

function FormDialog({ cfg, row, onClose, onSaved }: {
  cfg: ResourceConfig
  row: Row | null
  onClose: () => void
  onSaved: (r: Row, created: boolean) => void
}) {
  const { user } = useAuth()
  const editing = !!row
  const [values, setValues] = useState<Values>(() => {
    const v: Values = { ...(cfg.defaultValues?.(user!) ?? {}) }
    if (row) for (const f of cfg.fields) v[f.name] = toText(row[f.name])
    return v
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [general, setGeneral] = useState('')
  const set = (k: string, val: string) => setValues((s) => ({ ...s, [k]: val }))

  const mutation = useMutation({
    mutationFn: async () => {
      const body: Row = {}
      const local: Record<string, string> = {}
      for (const f of cfg.fields) {
        const ctx = { user: user!, values, editing }
        if (f.hide?.(ctx) || (editing && f.createOnly)) continue
        const raw = (values[f.name] ?? '').trim()
        if (f.type === 'json') {
          if (!raw) {
            body[f.name] = {}
            continue
          }
          try {
            body[f.name] = JSON.parse(raw)
          } catch {
            local[f.name] = 'JSON no válido.'
          }
        } else if (f.type === 'relation') {
          body[f.name] = raw ? Number(raw) : null
        } else if (raw === '') {
          body[f.name] = f.nullable ? null : ''
        } else {
          body[f.name] = f.type === 'password' ? values[f.name] : raw
        }
      }
      if (Object.keys(local).length) throw Object.assign(new Error('local'), { local })
      return api<Row>(editing ? `/${cfg.path}/${row![cfg.idKey]}/` : `/${cfg.path}/`, {
        method: editing ? 'PATCH' : 'POST',
        body: cfg.prepareBody ? cfg.prepareBody(body, values, user!) : body,
      })
    },
    onSuccess: (r) => onSaved(r, !editing),
    onError: (e: any) => {
      if (e.local) {
        setErrors(e.local)
        return
      }
      if (e instanceof ApiError) {
        // Los errores de campos que no se ven en pantalla van al mensaje general.
        const ctx = { user: user!, values, editing }
        const visible = new Set(
          cfg.fields.filter((f) => !f.hide?.(ctx) && !(editing && f.createOnly)).map((f) => f.name),
        )
        const own: Record<string, string> = {}
        const extra: string[] = []
        for (const [k, v] of Object.entries(fieldErrors(e))) {
          if (visible.has(k)) own[k] = v
          else extra.push(k === 'non_field_errors' ? v : `${k}: ${v}`)
        }
        setErrors(own)
        setGeneral(e.codigo === 'validacion' ? extra.join(' ') : e.message)
      } else setGeneral('Error inesperado.')
    },
  })

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? `Editar ${cfg.singular}` : `Nuevo ${cfg.singular}`}</DialogTitle>
          <DialogDescription>Los campos marcados con * son obligatorios.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            setErrors({})
            setGeneral('')
            mutation.mutate()
          }}
        >
          {cfg.fields.map((f) => {
            const ctx = { user: user!, values, editing }
            if (f.hide?.(ctx) || (editing && f.createOnly)) return null
            const id = `f-${f.name}`
            const val = values[f.name] ?? ''
            return (
              <div key={f.name} className="grid gap-1.5">
                <Label htmlFor={id}>
                  {f.label}
                  {f.required && ' *'}
                </Label>
                {f.type === 'textarea' ? (
                  <Textarea id={id} value={val} onChange={(e) => set(f.name, e.target.value)} rows={3} />
                ) : f.type === 'json' ? (
                  <Textarea
                    id={id}
                    value={val}
                    onChange={(e) => set(f.name, e.target.value)}
                    rows={5}
                    className="font-mono text-xs"
                    placeholder="{}"
                  />
                ) : f.type === 'select' ? (
                  <SelectField
                    id={id}
                    value={val}
                    onChange={(v) => set(f.name, v)}
                    options={typeof f.options === 'function' ? f.options(ctx) : (f.options ?? [])}
                  />
                ) : f.type === 'relation' ? (
                  <RelationSelect id={id} field={f} value={val} onChange={(v) => set(f.name, v)} />
                ) : (
                  <Input
                    id={id}
                    type={f.type}
                    value={val}
                    onChange={(e) => set(f.name, e.target.value)}
                    autoComplete={f.type === 'password' ? 'new-password' : 'off'}
                  />
                )}
                {f.hint && !errors[f.name] && <p className="text-xs text-muted-foreground">{f.hint}</p>}
                {errors[f.name] && <p className="text-xs text-destructive">{errors[f.name]}</p>}
              </div>
            )
          })}
          {general && <p className="text-sm text-destructive">{general}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando…' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function ResourcePage({ cfg }: { cfg: ResourceConfig }) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [ordering, setOrdering] = useState('')
  const [form, setForm] = useState<{ row: Row | null } | null>(null)
  const [del, setDel] = useState<Row | null>(null)
  const [extra, setExtra] = useState<ReactNode>(null)
  const q = useDebounced(search)

  useEffect(() => {
    setPage(1)
  }, [q, ordering])

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['list', cfg.path, page, q, ordering],
    queryFn: () => api<Page<Row>>(`/${cfg.path}/`, { params: { page, page_size: 20, search: q, ordering } }),
    placeholderData: keepPreviousData,
  })

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['list'] })
    qc.invalidateQueries({ queryKey: ['rel'] })
  }
  const helpers: Helpers = { refresh, show: setExtra }

  const remove = useMutation({
    mutationFn: (r: Row) => api(`/${cfg.path}/${r[cfg.idKey]}/`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success(`${cfg.singular} eliminado`)
      setDel(null)
      refresh()
    },
    onError: (e: Error) => {
      toast.error(e.message)
      setDel(null)
    },
  })

  const canWrite = cfg.canWrite(user!)
  const canDelete = canWrite && (cfg.canDelete?.(user!) ?? true)
  const total = data?.count ?? 0
  const pages = Math.max(1, Math.ceil(total / 20))
  const colSpan = cfg.columns.length + 1

  const toggleSort = (field: string) => setOrdering((o) => (o === field ? `-${field}` : o === `-${field}` ? '' : field))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{cfg.title}</h1>
          {cfg.description && <p className="text-sm text-muted-foreground">{cfg.description}</p>}
        </div>
        {canWrite && (
          <Button onClick={() => setForm({ row: null })}>
            <Plus /> Nuevo {cfg.singular}
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input className="pl-8" placeholder="Buscar…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {cfg.columns.map((c) => (
                <TableHead key={c.header}>
                  {c.sort ? (
                    <button className="-my-1.5 inline-flex items-center gap-1 py-1.5 hover:text-foreground" onClick={() => toggleSort(c.sort!)}>
                      {c.header}
                      {ordering === c.sort && <ArrowUp className="size-3" />}
                      {ordering === `-${c.sort}` && <ArrowDown className="size-3" />}
                    </button>
                  ) : (
                    c.header
                  )}
                </TableHead>
              ))}
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody className={isFetching && !isLoading ? 'opacity-60' : ''}>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={colSpan}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="py-8 text-center text-destructive">
                  {(error as Error).message}
                </TableCell>
              </TableRow>
            ) : data?.results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="py-8 text-center text-muted-foreground">
                  Sin resultados.
                </TableCell>
              </TableRow>
            ) : (
              data?.results.map((row) => {
                const extras = cfg.rowActions?.(row, helpers, user!) ?? []
                const hasMenu = canWrite || extras.length > 0
                return (
                  <TableRow key={row[cfg.idKey]}>
                    {cfg.columns.map((c) => (
                      <TableCell key={c.header}>{c.render(row)}</TableCell>
                    ))}
                    <TableCell>
                      {hasMenu && (
                        <DropdownMenu>
                          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Acciones" />}>
                            <MoreHorizontal />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canWrite && (
                              <DropdownMenuItem onClick={() => setForm({ row })}>
                                <Pencil /> Editar
                              </DropdownMenuItem>
                            )}
                            {extras.map((a) => (
                              <DropdownMenuItem key={a.label} onClick={a.onClick}>
                                {a.label}
                              </DropdownMenuItem>
                            ))}
                            {canDelete && (
                              <DropdownMenuItem variant="destructive" onClick={() => setDel(row)}>
                                <Trash2 /> Eliminar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {total} registro{total === 1 ? '' : 's'}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Anterior">
            <ChevronLeft />
          </Button>
          <span>
            Página {page} de {pages}
          </span>
          <Button variant="outline" size="icon-sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} aria-label="Siguiente">
            <ChevronRight />
          </Button>
        </div>
      </div>

      {form && (
        <FormDialog
          cfg={cfg}
          row={form.row}
          onClose={() => setForm(null)}
          onSaved={(r, created) => {
            setForm(null)
            refresh()
            toast.success(created ? `${cfg.singular} creado` : `${cfg.singular} actualizado`)
            cfg.onSaved?.(r, created, helpers)
          }}
        />
      )}

      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {cfg.singular}?</AlertDialogTitle>
            <AlertDialogDescription>
              {cfg.deleteNote ?? 'El registro se eliminará de las listas. Si tiene elementos dependientes, el servidor rechazará la acción.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => del && remove.mutate(del)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {extra}
    </div>
  )
}
