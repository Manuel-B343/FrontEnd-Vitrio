import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, fieldErrors, tokens } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { ROL_LABEL, type Perfil } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function Field({ id, label, error, ...props }: React.ComponentProps<typeof Input> & { label: string; error?: string }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...props} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function PerfilForm() {
  const { user, setUser } = useAuth()
  const [v, setV] = useState({
    email: user!.email,
    first_name: user!.first_name,
    last_name: user!.last_name,
    fecha_nacimiento: user!.fecha_nacimiento ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const m = useMutation({
    mutationFn: () => api<Perfil>('/auth/me/', { method: 'PATCH', body: { ...v, fecha_nacimiento: v.fecha_nacimiento || null } }),
    onSuccess: (p) => {
      setUser(p)
      setErrors({})
      toast.success('Perfil actualizado')
    },
    onError: (e) => setErrors(fieldErrors(e)),
  })
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value })
  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos personales</CardTitle>
        <CardDescription className="flex items-center gap-2">
          {user!.username} <Badge variant="secondary">{ROL_LABEL[user!.rol]}</Badge>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); m.mutate() }}>
          <Field id="email" label="Email" type="email" value={v.email} onChange={set('email')} error={errors.email} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="first_name" label="Nombre" value={v.first_name} onChange={set('first_name')} error={errors.first_name} />
            <Field id="last_name" label="Apellidos" value={v.last_name} onChange={set('last_name')} error={errors.last_name} />
          </div>
          <Field id="fecha_nacimiento" label="Fecha de nacimiento" type="date" value={v.fecha_nacimiento} onChange={set('fecha_nacimiento')} error={errors.fecha_nacimiento} />
          <Button type="submit" className="w-fit" disabled={m.isPending}>Guardar cambios</Button>
        </form>
      </CardContent>
    </Card>
  )
}

function PasswordForm() {
  const { logout } = useAuth()
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const m = useMutation({
    mutationFn: () => api('/auth/cambiar-password/', { method: 'POST', body: { password_actual: actual, password_nueva: nueva } }),
    onSuccess: () => {
      toast.success('Contraseña cambiada. Inicia sesión de nuevo.')
      // Las sesiones murieron en el servidor: se limpia el estado local.
      tokens.clear()
      void logout()
    },
    onError: (e) => {
      const f = fieldErrors(e)
      setErrors(Object.keys(f).length ? f : { password_nueva: (e as Error).message })
    },
  })
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cambiar contraseña</CardTitle>
        <CardDescription>Al cambiarla se cerrarán todas tus sesiones.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); setErrors({}); m.mutate() }}>
          <Field id="actual" label="Contraseña actual" type="password" autoComplete="current-password" value={actual} onChange={(e) => setActual(e.target.value)} error={errors.password_actual} />
          <Field id="nueva" label="Nueva contraseña" type="password" autoComplete="new-password" value={nueva} onChange={(e) => setNueva(e.target.value)} error={errors.password_nueva} />
          <Button type="submit" className="w-fit" disabled={m.isPending || !actual || !nueva}>Cambiar contraseña</Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function Profile() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Mi perfil</h1>
      <PerfilForm />
      <PasswordForm />
    </div>
  )
}
