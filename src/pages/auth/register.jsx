import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { AuthLayout } from '@/components/features/auth/auth-layout'
import { Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register: registerUser } = useAuth()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setLoading(true)
    setError('')
    try {
      await registerUser({ name: formData.get('name'), email: formData.get('email'), password: formData.get('password') })
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm text-center space-y-4 rounded-xl border border-white/5 bg-card p-6"
        >
          <h2 className="text-xl font-bold text-white">Registro exitoso</h2>
          <p className="text-sm text-slate-400">
            Tu cuenta fue creada correctamente. Ya podés iniciar sesión.
          </p>
          <Link to="/">
            <Button className="bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/15">
              Ir a iniciar sesión
            </Button>
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <AuthLayout error={error}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs font-medium text-slate-400">
            Nombre
          </Label>
          <Input
            id="name"
            name="name"
            required
            placeholder="Tu nombre completo"
            className="h-10 bg-white/[0.02] border-white/10 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/15 text-sm placeholder:text-slate-700 transition-all duration-200"
          />
        </div>

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
            minLength={8}
            placeholder="Mínimo 8 caracteres"
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
              Creando cuenta...
            </span>
          ) : (
            'Crear cuenta'
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-600">
        ¿Ya tenés cuenta?{' '}
        <Link to="/" className="text-violet-400 hover:text-violet-300 transition-colors font-medium">
          Iniciá sesión
        </Link>
      </p>
    </AuthLayout>
  )
}
