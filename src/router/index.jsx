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
const SettingsPage = lazy(() => import('@/pages/settings/settings'))
const InvestmentHistoryPage = lazy(() => import('@/pages/inversiones/index'))
const GananciasPage = lazy(() => import('@/pages/ganancias/index'))
const WalletPage = lazy(() => import('@/pages/wallet/index'))
const AdminUsersPage = lazy(() => import('@/pages/admin/users'))
const AdminRolesPage = lazy(() => import('@/pages/admin/roles'))
const MarketplacePage = lazy(() => import('@/pages/marketplace/index'))
const ModulesPage = lazy(() => import('@/pages/modules/index'))
const CreatorProfilePage = lazy(() => import('@/pages/creators/creator-profile'))
const IdeaWrappedPage = lazy(() => import('@/pages/dashboard/idea-wrapped'))

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
        <Route path="/marketplace" element={<LazyPage Component={MarketplacePage} />} />
        <Route path="/perfil" element={<Navigate to="/configuracion" replace />} />
        <Route path="/configuracion" element={<LazyPage Component={SettingsPage} />} />

        <Route path="/admin/usuarios" element={<AdminRoute><LazyPage Component={AdminUsersPage} /></AdminRoute>} />
        <Route path="/admin/roles" element={<AdminRoute><LazyPage Component={AdminRolesPage} /></AdminRoute>} />
        <Route path="/admin/modulos" element={<AdminRoute><LazyPage Component={ModulesPage} /></AdminRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
