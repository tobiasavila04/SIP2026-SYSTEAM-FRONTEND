import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { apiRequest, clearStoredAuth } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'
import { useAuthStore } from '@/stores/auth-store'
import { UserRound } from 'lucide-react'

export default function CompleteProfilePage() {
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)

  const handleSelectRole = async (role) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const userId = payload.userId
      const roleId = role === 'INVESTOR' ? 3 : 2

      await apiRequest(API_ENDPOINTS.USER_ROLE(userId, roleId), {
        method: 'POST',
      })

      clearStoredAuth()
      window.location.href = '/'
    } catch {
      alert('Error al asignar rol')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
            <UserRound className="w-8 h-8 text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Completá tu perfil</h1>
          <p className="text-sm text-slate-400 mt-2">
            Elegí cómo querés participar en la plataforma
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => handleSelectRole('INVESTOR')}
            className="rounded-xl border border-white/5 bg-card p-6 text-left hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group"
          >
            <h3 className="text-lg font-semibold text-white group-hover:text-emerald-300 transition-colors">
              Quiero Invertir
            </h3>
            <p className="text-sm text-slate-400 mt-2">
              Explorá proyectos y aportá capital para obtener rendimientos.
            </p>
          </button>

          <button
            onClick={() => handleSelectRole('CREATOR')}
            className="rounded-xl border border-white/5 bg-card p-6 text-left hover:border-violet-500/30 hover:bg-violet-500/5 transition-all group"
          >
            <h3 className="text-lg font-semibold text-white group-hover:text-violet-300 transition-colors">
              Quiero Publicar
            </h3>
            <p className="text-sm text-slate-400 mt-2">
              Publicá proyectos y obtené financiamiento de la comunidad.
            </p>
          </button>
        </div>
      </div>
    </div>
  )
}
