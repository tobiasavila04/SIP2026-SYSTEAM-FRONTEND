import { NavLink } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-store'
import { usePermissions } from '@/stores/auth-store'
import {
  LayoutDashboard,
  FolderKanban,
  TrendingUp,
  Settings,
  Users,
  KeyRound,
  ChevronLeft,
  Menu,
  Wallet,
  Vote,
  Store,
  BadgeDollarSign,
  Calendar,
} from 'lucide-react'
import { useAccount, useReadContract, useBalance } from 'wagmi'
import { formatUnits } from 'viem'
import { cn } from '@/lib/utils'
import { ERC20_ABI } from '@/lib/abis'

const mainNav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/proyectos', label: 'Proyectos', icon: FolderKanban },
  { to: '/inversiones', label: 'Inversiones', icon: TrendingUp },
  { to: '/billetera', label: 'Billetera', icon: Wallet },
  { to: '/marketplace', label: 'Marketplace', icon: Store },
  { to: '/gobernanza', label: 'Gobernanza', icon: Vote },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
]

const adminNav = [
  { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { to: '/admin/roles', label: 'Roles', icon: KeyRound },
  { to: '/admin/eventos', label: 'Eventos', icon: Calendar },
  // Permisos gestionados desde Roles
]

const IDEA_TOKEN_ADDRESS = import.meta.env.VITE_IDEA_TOKEN_ADDRESS

function WalletInfo({ collapsed }) {
  const { address, isConnected, chain } = useAccount()
  const { data: ideaBalance } = useReadContract({
    address: IDEA_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  })
  const { data: decimals } = useReadContract({
    address: IDEA_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: { enabled: isConnected },
  })
  const { data: ethBalance } = useBalance({ address })

  if (!isConnected || !address) return null

  const formattedIdea = ideaBalance && decimals
    ? Number(formatUnits(ideaBalance, decimals)).toLocaleString(undefined, { maximumFractionDigits: 2 })
    : '—'
  const formattedEth = ethBalance
    ? Number(formatUnits(ethBalance.value, ethBalance.decimals)).toLocaleString(undefined, { maximumFractionDigits: 4 })
    : '—'

  if (collapsed) return null

  return (
    <div className="mx-2 mb-2 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
        <span className="text-xs text-slate-400 font-mono truncate">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-500 uppercase tracking-wider">$IDEA</span>
        <span className="text-sm font-semibold text-white">{formattedIdea}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-500 uppercase tracking-wider">{chain?.nativeCurrency?.symbol || 'ETH'}</span>
        <span className="text-sm font-semibold text-white">{formattedEth}</span>
      </div>
    </div>
  )
}

export function Sidebar({ collapsed, onToggle }) {
  const roles = useAuthStore((s) => s.roles)
  const isAdmin = roles.includes('ADMIN')
  const { isCreator, isInvestor, can } = usePermissions()
  const showGanancias = isCreator || isInvestor

  const filteredMainNav = mainNav.filter(item => {
    if (item.to === '/inversiones') return can('investment:read') || can('investment:create')
    if (item.to === '/marketplace') return can('investment:create')
    if (item.to === '/gobernanza') return can('governance:read')
    if (item.to === '/billetera') return isCreator || isInvestor
    return true
  })

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
        aria-label="Menú de navegación"
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
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-3 min-w-0">
              <img src="/logo.png" alt="IDEAFY" className="shrink-0 transition-all w-10 h-10" />
              <span className="text-2xl font-bold text-white tracking-tight pt-0.5">IDEAFY</span>
            </div>
          )}
          <button
            onClick={onToggle}
            className={cn(
              'p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors',
              collapsed && 'mx-auto',
            )}
            aria-label={collapsed ? 'Abrir menú' : 'Cerrar menú'}
          >
            {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav aria-label="Secciones" className="flex-1 p-2 space-y-1 overflow-y-auto">
          <NavSection label={collapsed ? undefined : 'Principal'}>
            {filteredMainNav.flatMap(({ to, label, icon: Icon }) => {
              const items = [
                <NavItem key={to} to={to} icon={Icon} label={label} collapsed={collapsed} />,
              ]
              if (to === '/inversiones' && showGanancias) {
                items.push(
                  <NavItem key="/ganancias" to="/ganancias" icon={BadgeDollarSign} label="Ganancias" collapsed={collapsed} />
                )
              }
              return items
            })}
          </NavSection>

          {isAdmin && (
            <NavSection label={collapsed ? undefined : 'Administración'}>
              {adminNav.map(({ to, label, icon: Icon }) => (
                <NavItem key={to} to={to} icon={Icon} label={label} collapsed={collapsed} />
              ))}
            </NavSection>
          )}
        </nav>

        <WalletInfo collapsed={collapsed} />
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
