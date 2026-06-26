import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-store'
import { useAuth } from '@/providers/auth-provider'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { PageSkeleton } from '@/components/shared/loading-skeleton'

const LoginPage = lazy(() => import('@/pages/auth/login'))
const RegisterPage = lazy(() => import('@/pages/auth/register'))
const OAuth2CallbackPage = lazy(() => import('@/pages/auth/callback'))
const CompleteProfilePage = lazy(() => import('@/pages/auth/complete-profile'))
const DashboardPage = lazy(() => import('@/pages/dashboard/dashboard'))
const PublicCatalogPage = lazy(() => import('@/pages/projects/public-catalog'))
const ProjectCatalogPage = lazy(() => import('@/pages/projects/index'))
const ProjectDetailPage = lazy(() => import('@/pages/projects/project-detail'))
const ProjectEditorPage = lazy(() => import('@/pages/projects/project-editor'))
const ProfilePage = lazy(() => import('@/pages/settings/settings'))
const InvestmentHistoryPage = lazy(() => import('@/pages/inversiones/index'))
const GananciasPage = lazy(() => import('@/pages/ganancias/index'))
const WalletPage = lazy(() => import('@/pages/wallet/index'))
const AdminUsersPage = lazy(() => import('@/pages/admin/users'))
const AdminRolesPage = lazy(() => import('@/pages/admin/roles'))
const AuditsPage = lazy(() => import('@/pages/audits/index'))
const MarketplacePage = lazy(() => import('@/pages/marketplace/index'))
const GobernanzaPage = lazy(() => import('@/pages/gobernanza/index'))
const AdminEventosPage = lazy(() => import('@/pages/admin/eventos'))
const ModulesPage = lazy(() => import('@/pages/modules/index'))
const CreatorProfilePage = lazy(() => import('@/pages/creators/creator-profile'))
const IdeaWrappedPage = lazy(() => import('@/pages/dashboard/idea-wrapped'))
const CollectorDashboard = lazy(() => import('@/components/gamification/CollectorDashboard').then(m => ({ default: m.CollectorDashboard })))
const EventosPage = lazy(() => import('@/pages/eventos/index'))
const RecompensasPage = lazy(() => import('@/pages/recompensas/index'))

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to="/" state={{ from: location }} replace />
  return <>{children}</>
}

function GuestRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const roles = useAuthStore((s) => s.roles)
  if (isAuthenticated && roles.some(r => ['INVESTOR', 'CREATOR', 'ADMIN'].includes(r)))
    return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AdminRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const roles = useAuthStore((s) => s.roles)
  const { isLoading } = useAuth()
  if (!isAuthenticated) return <Navigate to="/" replace />
  if (isLoading) return <PageSkeleton />
  if (!user) return null
  if (!roles.includes('ADMIN')) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function LazyPage({ Component }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Component />
    </Suspense>
  )
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/registro" element={<GuestRoute><RegisterPage /></GuestRoute>} />
      <Route path="/oauth2/callback" element={<OAuth2CallbackPage />} />
      <Route path="/completar-perfil" element={<ProtectedRoute><CompleteProfilePage /></ProtectedRoute>} />
      <Route path="/explorar" element={<LazyPage Component={PublicCatalogPage} />} />
      <Route path="/creators/:id" element={<LazyPage Component={CreatorProfilePage} />} />
      <Route path="/wrapped" element={<ProtectedRoute><LazyPage Component={IdeaWrappedPage} /></ProtectedRoute>} />

      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<LazyPage Component={DashboardPage} />} />
        <Route path="/proyectos" element={<LazyPage Component={ProjectCatalogPage} />} />
        <Route path="/proyectos/crear" element={<LazyPage Component={ProjectEditorPage} />} />
        <Route path="/proyectos/:id/editar" element={<LazyPage Component={ProjectEditorPage} />} />
        <Route path="/proyectos/:id" element={<LazyPage Component={ProjectDetailPage} />} />
        <Route path="/inversiones" element={<LazyPage Component={InvestmentHistoryPage} />} />
        <Route path="/ganancias" element={<LazyPage Component={GananciasPage} />} />
        <Route path="/billetera" element={<LazyPage Component={WalletPage} />} />
        <Route path="/coleccion" element={<LazyPage Component={CollectorDashboard} />} />
        <Route path="/marketplace" element={<LazyPage Component={MarketplacePage} />} />
        <Route path="/gobernanza" element={<LazyPage Component={GobernanzaPage} />} />
        <Route path="/eventos" element={<LazyPage Component={EventosPage} />} />
        <Route path="/recompensas" element={<LazyPage Component={RecompensasPage} />} />
        <Route path="/perfil" element={<LazyPage Component={ProfilePage} />} />
        <Route path="/configuracion" element={<Navigate to="/perfil" replace />} />

        <Route path="/admin/usuarios" element={<AdminRoute><LazyPage Component={AdminUsersPage} /></AdminRoute>} />
        <Route path="/admin/roles" element={<AdminRoute><LazyPage Component={AdminRolesPage} /></AdminRoute>} />
        <Route path="/auditoria" element={<AdminRoute><LazyPage Component={AuditsPage} /></AdminRoute>} />
        <Route path="/admin/eventos" element={<AdminRoute><LazyPage Component={AdminEventosPage} /></AdminRoute>} />
        <Route path="/admin/modulos" element={<AdminRoute><LazyPage Component={ModulesPage} /></AdminRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
