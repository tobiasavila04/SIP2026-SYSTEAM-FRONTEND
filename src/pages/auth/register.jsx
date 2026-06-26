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
    
    const password = formData.get('password')
    const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).{8,}$/
    if (!passwordRegex.test(password)) {
      setError('La contraseña debe contener al menos un número, una mayúscula, una minúscula y un carácter especial (@#$%^&+=!)')
      return
    }

    const fechaNacimiento = formData.get('fechaNacimiento')
    if (fechaNacimiento) {
      const birthDate = new Date(fechaNacimiento)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const m = today.getMonth() - birthDate.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      if (age < 18) {
        setError('Debes ser mayor de 18 años para registrarte')
        return
      }
    }

    setLoading(true)
    setError('')
    const ref = new URLSearchParams(window.location.search).get('ref')
    try {
      await registerUser({
        name: formData.get('name'),
        email: formData.get('email'),
        password: password,
        fechaNacimiento: fechaNacimiento
      })
      setSuccess(true)
      if (ref) localStorage.setItem('pending_referral_code', ref)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-sm text-center space-y-6 rounded-2xl border border-emerald-500/20 bg-[#13172B] p-8 shadow-2xl shadow-emerald-500/10 relative overflow-hidden"
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
          <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20">
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">¡Registro exitoso!</h2>
            <p className="text-sm text-slate-400">
              Tu cuenta ha sido creada correctamente. Ya podés iniciar sesión y comenzar a invertir.
            </p>
          </div>
          <Link to="/" className="block mt-8">
            <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 rounded-xl h-11 text-sm font-medium">
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
          <Label htmlFor="fechaNacimiento" className="text-xs font-medium text-slate-400">
            Fecha de Nacimiento
          </Label>
          <Input
            id="fechaNacimiento"
            name="fechaNacimiento"
            type="date"
            required
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
            placeholder="Ingresar contraseña"
            className="h-10 bg-white/[0.02] border-white/10 focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/15 text-sm placeholder:text-slate-700 transition-all duration-200"
          />
          <p className="text-[10px] text-slate-500 mt-1">
            * Mínimo 8 caracteres, 1 mayúscula, 1 número y 1 carácter especial (@#$%^&+=!)
          </p>
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
