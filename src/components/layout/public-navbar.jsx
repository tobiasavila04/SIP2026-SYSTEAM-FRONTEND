import { Link, useNavigate } from 'react-router-dom'
import { Search, Sparkles } from 'lucide-react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'

export function PublicNavbar({ search, onSearchChange }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const navigate = useNavigate()

  return (
    <header className="h-16 border-b border-white/5 bg-[#0A0C14]/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        <Link to="/explorar" className="flex items-center gap-2 shrink-0">
          <img src="/logo.png" alt="IDEAFY" className="w-7 h-7" />
          <span className="text-lg font-bold text-white tracking-tight">IDEAFY</span>
        </Link>

        <div className="flex-1 max-w-md mx-auto hidden sm:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search || ''}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Buscar proyectos..."
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Button
              onClick={() => navigate('/dashboard')}
              className="bg-violet-600 hover:bg-violet-500 text-white h-9 px-4 text-sm rounded-lg"
            >
              Ir al Dashboard
            </Button>
          ) : (
            <Button
              onClick={() => navigate('/')}
              className="bg-violet-600 hover:bg-violet-500 text-white h-9 px-4 text-sm rounded-lg"
            >
              Iniciar sesión
            </Button>
          )}
        </div>
      </div>

      {/* Search bar on mobile */}
      <div className="sm:hidden px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search || ''}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Buscar proyectos..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
          />
        </div>
      </div>
    </header>
  )
}
