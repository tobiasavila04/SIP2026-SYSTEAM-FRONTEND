import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { AuthLayout } from '@/components/features/auth/auth-layout'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setLoading(true)
    setError('')
    try {
      await login({ email: formData.get('email'), password: formData.get('password') })
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/oauth2/authorization/google`
  }

  return (
    <AuthLayout error={error}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-medium text-slate-400">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="tu@email.com"
            className="h-10 bg-white/[0.02] border-white/10 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/15 text-sm placeholder:text-slate-700 transition-all duration-200"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-medium text-slate-400">
            Contraseña
          </Label>
          <PasswordInput
            id="password"
            name="password"
            required
            placeholder="••••••••"
            className="h-10 bg-white/[0.02] border-white/10 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/15 text-sm placeholder:text-slate-700 transition-all duration-200"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-10 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg transition-all duration-150 active:scale-[0.98] shadow-lg shadow-violet-600/15"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Iniciando sesión...
            </span>
          ) : (
            'Entrar'
          )}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/[0.06]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-card px-2 text-xs text-slate-600">o continuá con</span>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full h-10 gap-2.5 border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all active:scale-[0.98]"
        onClick={handleGoogleLogin}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Google
      </Button>

      <p className="text-center text-sm text-slate-600">
        ¿No tenés cuenta?{' '}
        <Link to="/registro" className="text-violet-400 hover:text-violet-300 transition-colors font-medium">
          Registrate
        </Link>
      </p>

      <div className="text-center">
        <Link
          to="/explorar"
          className="text-sm text-slate-500 hover:text-violet-400 transition-colors"
        >
          Explorar proyectos sin cuenta →
        </Link>
      </div>
    </AuthLayout>
  )
}
