import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { setStoredTokens, setStoredUserId } from '@/lib/api-client'
import { useAuthStore } from '@/stores/auth-store'

export default function OAuth2CallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    const accessToken = searchParams.get('accessToken')
    const refreshToken = searchParams.get('refreshToken')
    const errorParam = searchParams.get('error')

    if (errorParam) {
      setError('Error al autenticar con Google')
      return
    }

    if (!accessToken) {
      setError('Parámetros de autenticación inválidos')
      return
    }

    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]))

      setStoredTokens(accessToken, refreshToken ?? '')
      if (payload.userId) {
        setStoredUserId(payload.userId)
      }

      useAuthStore.setState({
        token: accessToken,
        isAuthenticated: true,
        user: null,
        roles: payload.roles || [],
        permissions: payload.permissions || [],
      })

      navigate('/dashboard', { replace: true })
    } catch {
      setError('Error al procesar la autenticación')
    }
  }, [searchParams, navigate])

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="text-violet-400 hover:text-violet-300 text-sm"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Completando autenticación...</p>
      </div>
    </div>
  )
}
