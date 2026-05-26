import { useLocation, Outlet, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuthStore } from '@/stores/auth-store'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { clearStoredAuth } from '@/lib/api-client'
import { cn } from '@/lib/utils'

export function DashboardLayout() {
  const location = useLocation()
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
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar collapsed={!sidebarOpen} onToggle={toggleSidebar} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onLogout={handleLogout} />

        <main
          id="main-content"
          className={cn(
            'flex-1 overflow-auto p-6',
            'scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent'
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
