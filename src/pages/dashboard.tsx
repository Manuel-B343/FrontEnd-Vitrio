import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Building2, FileVideo, FolderKanban, LayoutTemplate, MonitorSmartphone, Users, type LucideIcon } from 'lucide-react'
import { api, type Page } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { ROL_LABEL } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const ITEMS: { path: string; title: string; icon: LucideIcon }[] = [
  { path: 'clientes', title: 'Clientes', icon: Building2 },
  { path: 'usuarios', title: 'Usuarios', icon: Users },
  { path: 'proyectos', title: 'Proyectos', icon: FolderKanban },
  { path: 'plantillas', title: 'Plantillas', icon: LayoutTemplate },
  { path: 'archivos', title: 'Archivos', icon: FileVideo },
  { path: 'dispositivos', title: 'Dispositivos', icon: MonitorSmartphone },
]

function Count({ path }: { path: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['count', path],
    queryFn: () => api<Page<unknown>>(`/${path}/`, { params: { page_size: 1 } }),
  })
  if (isLoading) return <Skeleton className="h-8 w-12" />
  if (error) return <span className="text-sm text-muted-foreground">—</span>
  return <span className="text-3xl font-semibold">{data?.count}</span>
}

export default function Dashboard() {
  const { user } = useAuth()
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hola, {user?.first_name || user?.username}</h1>
        <p className="text-sm text-muted-foreground">Sesión como {ROL_LABEL[user!.rol]}.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map(({ path, title, icon: Icon }) => (
          <Link key={path} to={`/${path}`}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Count path={path} />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
