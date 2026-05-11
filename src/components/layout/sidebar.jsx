import { NavLink } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-store'
import {
  LayoutDashboard,
  FolderKanban,
  UserCircle,
  Settings,
  Users,
  KeyRound,
  ChevronLeft,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const mainNav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/proyectos', label: 'Proyectos', icon: FolderKanban },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
]

const adminNav = [
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { to: '/admin/roles', label: 'Roles', icon: KeyRound },
  // Permisos gestionados desde Roles
]

export function Sidebar({ collapsed, onToggle }) {
  const roles = useAuthStore((s) => s.roles)
  const isAdmin = roles.includes('ADMIN')

  return (
    <>
      {/* Mobile backdrop */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'h-screen bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 z-50',
          'transition-all duration-300 ease-in-out',
          'overflow-hidden',
          // Mobile: fixed overlay drawer
          'fixed inset-y-0 left-0 md:relative',
          // Mobile: slide in/out
          collapsed ? '-translate-x-full' : 'translate-x-0',
          // Desktop: always visible, width depends on collapsed
          'md:translate-x-0',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border shrink-0">
          {!collapsed && (
            <span className="text-lg font-bold text-white tracking-tight">IDEAFY</span>
          )}
          <button
            onClick={onToggle}
            className={cn(
              'p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors',
              collapsed && 'mx-auto',
            )}
          >
            {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          <NavSection label={collapsed ? undefined : 'Principal'}>
            {mainNav.map(({ to, label, icon: Icon }) => (
              <NavItem key={to} to={to} icon={Icon} label={label} collapsed={collapsed} />
            ))}
          </NavSection>

          {isAdmin && (
            <NavSection label={collapsed ? undefined : 'Administración'}>
              {adminNav.map(({ to, label, icon: Icon }) => (
                <NavItem key={to} to={to} icon={Icon} label={label} collapsed={collapsed} />
              ))}
            </NavSection>
          )}
        </nav>
      </aside>
    </>
  )
}

function NavSection({ label, children }) {
  return (
    <div className="py-2">
      {label && (
        <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          {label}
        </p>
      )}
      {children}
    </div>
  )
}

function NavItem({ to, icon: Icon, label, collapsed }) {
  const setSidebarOpen = useAuthStore((s) => s.setSidebarOpen)

  const handleClick = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  return (
    <NavLink
      to={to}
      onClick={handleClick}
      className={({ isActive }) => cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
        isActive
          ? 'bg-violet-600/15 text-violet-300 font-medium'
          : 'text-slate-400 hover:text-white hover:bg-white/5',
        collapsed && 'justify-center px-2'
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  )
}
