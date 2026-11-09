import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider, useAuth } from '@/lib/auth'
import Layout, { NAV } from '@/components/layout'
import Login from '@/pages/login'
import Dashboard from '@/pages/dashboard'
import Profile from '@/pages/profile'
import { RESOURCES, ResourceRoute } from '@/pages/resources'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
})

// Evita entrar por URL a secciones que el menú oculta para el rol.
function PorRol({ path, children }: { path: string; children: React.ReactNode }) {
  const { user } = useAuth()
  const item = NAV.find((n) => n.to === path)
  if (user && item && !item.roles.includes(user.rol)) return <Navigate to="/" replace />
  return <>{children}</>
}

function Protected() {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex min-h-svh items-center justify-center text-muted-foreground">Cargando…</div>
  if (!user) return <Navigate to="/login" replace />
  return <Layout />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<Protected />}>
                <Route index element={<Dashboard />} />
                {Object.keys(RESOURCES).map((name) => (
                  <Route key={name} path={name} element={<PorRol path={`/${name}`}><ResourceRoute name={name} /></PorRol>} />
                ))}
                <Route path="perfil" element={<Profile />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          <Toaster richColors />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  )
}
