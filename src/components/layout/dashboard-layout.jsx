import { Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-store'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { clearStoredAuth } from '@/lib/api-client'

export function DashboardLayout() {
  const sidebarOpen = useAuthStore((s) => s.sidebarOpen)
  const toggleSidebar = useAuthStore((s) => s.toggleSidebar)
  const storeLogout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = () => {
    clearStoredAuth()
    storeLogout()
    navigate('/')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar collapsed={!sidebarOpen} onToggle={toggleSidebar} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onLogout={handleLogout} />
        <main id="main-content" className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
