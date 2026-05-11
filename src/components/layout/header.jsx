import { useAuthStore } from '@/stores/auth-store'
import { Menu, Bell, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Header({ onLogout }) {
  const user = useAuthStore((s) => s.user)
  const toggleSidebar = useAuthStore((s) => s.toggleSidebar)

  return (
    <header className="h-14 border-b border-sidebar-border bg-sidebar flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="text-slate-400 hover:text-white md:hidden"
        >
          <Menu className="w-4 h-4" />
        </Button>
        <span className="text-sm text-slate-400">
          {user?.name || 'Panel de Control'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:text-white relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-500 rounded-full" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onLogout}
          className="text-slate-400 hover:text-red-400"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  )
}
