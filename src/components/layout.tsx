import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  Building2, FileVideo, FolderKanban, LayoutDashboard, LayoutTemplate, LogOut, Menu, MonitorPlay,
  MonitorSmartphone, UserCircle, Users, type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { ROL_LABEL } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'

const NAV: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/clientes', label: 'Clientes', icon: Building2 },
  { to: '/usuarios', label: 'Usuarios', icon: Users },
  { to: '/proyectos', label: 'Proyectos', icon: FolderKanban },
  { to: '/plantillas', label: 'Plantillas', icon: LayoutTemplate },
  { to: '/archivos', label: 'Archivos', icon: FileVideo },
  { to: '/dispositivos', label: 'Dispositivos', icon: MonitorSmartphone },
]

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth()
  const link = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
      isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
    )
  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="flex items-center gap-2 px-2 py-2">
        <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <MonitorPlay className="size-4" />
        </div>
        <span className="text-lg font-semibold">Vitrio</span>
      </div>
      <nav className="mt-2 flex flex-1 flex-col gap-1">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={link} onClick={onNavigate}>
            <Icon className="size-4" /> {label}
          </NavLink>
        ))}
      </nav>
      <Separator />
      <NavLink to="/perfil" className={link} onClick={onNavigate}>
        <UserCircle className="size-4" />
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate">{user?.username}</span>
          <span className="text-xs font-normal opacity-70">{user && ROL_LABEL[user.rol]}</span>
        </span>
      </NavLink>
      <Button variant="ghost" className="justify-start text-muted-foreground" onClick={() => void logout()}>
        <LogOut /> Cerrar sesión
      </Button>
    </div>
  )
}

export default function Layout() {
  const [open, setOpen] = useState(false)
  return (
    <div className="min-h-svh md:grid md:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 hidden h-svh border-r bg-card md:block">
        <Sidebar />
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="flex items-center gap-2 border-b p-3 md:hidden">
          <Button variant="ghost" size="icon" aria-label="Menú" onClick={() => setOpen(true)}>
            <Menu />
          </Button>
          <span className="font-semibold">Vitrio</span>
        </header>
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-60 p-0">
          <SheetTitle className="sr-only">Navegación</SheetTitle>
          <Sidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
