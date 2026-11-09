import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  Building2, FileVideo, FolderKanban, LayoutDashboard, LayoutTemplate, LogOut, Menu,
  MonitorSmartphone, Users, type LucideIcon,
} from 'lucide-react'
import { Logo, LogoMark } from '@/components/logo'
import { useAuth } from '@/lib/auth'
import { ROL_LABEL, type Rol } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'

const TODOS: Rol[] = ['ADMINISTRADOR', 'ADMINISTRADOR_CLIENTE', 'CLIENTE']
const GESTION: Rol[] = ['ADMINISTRADOR', 'ADMINISTRADOR_CLIENTE']

type Item = { to: string; label: string; icon: LucideIcon; end?: boolean; roles: Rol[] }

// Solo oculta opciones: la regla real la aplica el servidor.
export const NAV: Item[] = [
  { to: '/', label: 'Resumen', icon: LayoutDashboard, end: true, roles: TODOS },
  { to: '/clientes', label: 'Clientes', icon: Building2, roles: GESTION },
  { to: '/usuarios', label: 'Usuarios', icon: Users, roles: GESTION },
  { to: '/proyectos', label: 'Proyectos', icon: FolderKanban, roles: TODOS },
  { to: '/plantillas', label: 'Plantillas', icon: LayoutTemplate, roles: GESTION },
  { to: '/archivos', label: 'Archivos', icon: FileVideo, roles: TODOS },
  { to: '/dispositivos', label: 'Dispositivos', icon: MonitorSmartphone, roles: TODOS },
]

const GRUPOS: { titulo: string; rutas: string[] }[] = [
  { titulo: 'Consola', rutas: ['/'] },
  { titulo: 'Operación', rutas: ['/proyectos', '/archivos', '/dispositivos'] },
  { titulo: 'Administración', rutas: ['/clientes', '/usuarios', '/plantillas'] },
]

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth()
  const link = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive
        ? 'bg-[#2563eb] text-white shadow-[0_0_16px_-4px_rgba(37,99,235,0.7)]'
        : 'text-muted-foreground hover:bg-white/[0.05] hover:text-foreground',
    )
  const visibles = NAV.filter((n) => user && n.roles.includes(user.rol))
  const inicial = (user?.first_name || user?.username || '?').charAt(0).toUpperCase()

  return (
    <div className="flex h-full flex-col p-3">
      <div className="px-2 pb-4 pt-2">
        <Logo size={28} />
        <p className="etiqueta mt-2 pl-0.5 text-[0.6rem]">Sala de control</p>
      </div>
      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto">
        {GRUPOS.map((g) => {
          const items = visibles.filter((n) => g.rutas.includes(n.to))
          if (!items.length) return null
          return (
            <div key={g.titulo} className="grid gap-1">
              <p className="etiqueta px-3 pb-1">{g.titulo}</p>
              {items.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className={link} onClick={onNavigate}>
                  <Icon className="size-[18px]" /> {label}
                </NavLink>
              ))}
            </div>
          )
        })}
      </nav>
      <div className="mt-3 flex items-center gap-1 rounded-xl border border-white/[0.08] bg-card p-1.5">
        <NavLink
          to="/perfil"
          onClick={onNavigate}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-white/[0.05]"
        >
          <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-[#1d4ed8] text-sm font-bold text-white">
            {inicial}
            <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 ring-2 ring-card" />
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-medium">{user?.first_name || user?.username}</span>
            <span className="etiqueta truncate text-[0.6rem] text-blue-300">{user && ROL_LABEL[user.rol]}</span>
          </span>
        </NavLink>
        <Button variant="ghost" size="icon" aria-label="Cerrar sesión" className="text-muted-foreground" onClick={() => void logout()}>
          <LogOut />
        </Button>
      </div>
    </div>
  )
}

export default function Layout() {
  const [open, setOpen] = useState(false)
  return (
    <div className="min-h-svh md:grid md:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-svh border-r border-white/[0.07] bg-sidebar md:block">
        <Sidebar />
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-white/[0.07] bg-sidebar p-3 md:hidden">
          <Button variant="ghost" size="icon" aria-label="Menú" onClick={() => setOpen(true)}>
            <Menu />
          </Button>
          <LogoMark size={22} />
          <span className="font-bold tracking-[0.08em]">VITRIO</span>
        </header>
        <main className="mx-auto w-full max-w-[1400px] flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 border-white/[0.07] bg-sidebar p-0">
          <SheetTitle className="sr-only">Navegación</SheetTitle>
          <Sidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
