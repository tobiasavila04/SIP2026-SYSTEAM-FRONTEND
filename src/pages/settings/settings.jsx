import { useState } from 'react'
import { motion } from 'framer-motion'
import { apiRequest } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'
import { useAuthStore } from '@/stores/auth-store'
import { useUpdateUserPartial } from '@/hooks/use-users'
import { useWalletSummary } from '@/hooks/use-wallet'
import { InvestorLevelCard } from '@/components/features/users/investor-level-card'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { Switch } from '@/components/ui/switch'
import { cn, formatDate, formatDateUTC } from '@/lib/utils'
import {
  User, Mail, Calendar, Shield, Bell, Key, AlertTriangle, Pencil, Loader2,
  Wallet, TrendingUp, AlertCircle, Layers,
} from 'lucide-react'

const SECTIONS = [
  { id: 'profile', label: 'Perfil', icon: User },
  { id: 'security', label: 'Seguridad', icon: Shield },
  { id: 'notifications', label: 'Notificaciones', icon: Bell },
  { id: 'api', label: 'API Keys', icon: Key },
]

function NavItem({ section, active, onSelect }) {
  const Icon = section.icon
  const isActive = active === section.id
  return (
    <button
      onClick={() => onSelect(section.id)}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all text-left ${
        isActive
          ? 'bg-violet-500/10 text-violet-300 font-medium'
          : 'text-slate-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {section.label}
    </button>
  )
}

function BalanceCard({ currency, balance, icon: Icon, index }) {
  const isIdea = currency === 'IDEA'
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
      className={cn('flex-1 rounded-xl border p-4 transition-all', isIdea ? 'border-violet-500/20 bg-violet-500/5' : 'border-emerald-500/20 bg-emerald-500/5')}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{currency}</span>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', isIdea ? 'bg-violet-500/10' : 'bg-emerald-500/10')}>
          <Icon className={cn('w-4 h-4', isIdea ? 'text-violet-400' : 'text-emerald-400')} />
        </div>
      </div>
      <p className={cn('text-xl font-bold', isIdea ? 'text-violet-200' : 'text-emerald-200')}>
        {Number(balance).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
      <p className="text-[10px] text-slate-600 mt-0.5">{isIdea ? 'Token de plataforma' : 'Stablecoin'}</p>
    </motion.div>
  )
}

function PortfolioItem({ proyectoNombre, subtokenNombre, subtokenSimbolo, cantidad, precioActual, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 + index * 0.05, duration: 0.3 }}
      className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-2 h-2 rounded-full bg-violet-500/40 shrink-0" />
        <span className="text-sm text-slate-300 truncate">{proyectoNombre} - {subtokenSimbolo ? `$ ${subtokenSimbolo}` : subtokenNombre}</span>
      </div>
      <div className="text-right shrink-0 ml-4">
        <p className="text-sm font-medium text-white">{Number(cantidad).toLocaleString('es-AR')}</p>
        {precioActual && (
          <p className="text-[10px] text-slate-600">@ {Number(precioActual).toLocaleString('es-AR', { minimumFractionDigits: 2 })} IDEA</p>
        )}
      </div>
    </motion.div>
  )
}

function WalletPanel() {
  const { data, isLoading, isError, dataUpdatedAt } = useWalletSummary()
  const saldoIdea = data?.balances?.idea ?? 0
  const portfolio = data?.portfolio ?? []

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="rounded-xl border border-white/5 bg-card p-6"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Billetera</h3>
            <p className="text-[10px] text-slate-600">
              {dataUpdatedAt ? `Actualizado ${new Date(dataUpdatedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}` : 'Saldos en tiempo real'}
            </p>
          </div>
        </div>
        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" />}
      </div>

      {isError ? (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Error al cargar los saldos</span>
        </div>
      ) : isLoading && !data ? (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 h-24 rounded-xl bg-white/[0.03] animate-pulse" />
            <div className="flex-1 h-24 rounded-xl bg-white/[0.03] animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-10 rounded-lg bg-white/[0.02] animate-pulse" />
            <div className="h-10 rounded-lg bg-white/[0.02] animate-pulse" />
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex gap-3">
            <BalanceCard currency="IDEA" balance={saldoIdea} icon={TrendingUp} index={0} />
          </div>
          {portfolio.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Portfolio ({portfolio.length})</span>
              </div>
              <div className="bg-black/10 rounded-lg px-3">
                {portfolio.map((item, i) => (
                  <PortfolioItem key={item.subtokenId ?? i} {...item} index={i} />
                ))}
              </div>
            </div>
          )}
          {!isLoading && portfolio.length === 0 && (
            <p className="text-xs text-slate-600 text-center py-2">No tenés subtokens en tu portfolio</p>
          )}
        </div>
      )}
    </motion.div>
  )
}

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const roles = useAuthStore((s) => s.roles)
  const updateUser = useUpdateUserPartial()

  const [activeSection, setActiveSection] = useState('profile')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editFechaNacimiento, setEditFechaNacimiento] = useState('')
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: false,
  })

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setSuccess('')
    setError('')

    const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!]).{8,}$/
    if (!passwordRegex.test(newPassword)) {
      setError('La contraseña debe contener al menos un número, una mayúscula, una minúscula y un carácter especial (@#$%^&+=!)')
      return
    }

    setPasswordLoading(true)
    try {
      await apiRequest(API_ENDPOINTS.AUTH_CHANGE_PASSWORD, {
        method: 'POST',
        body: { currentPassword, newPassword },
      })
      setSuccess('Contraseña actualizada correctamente.')
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar la contraseña')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleStartEdit = () => {
    setEditName(user?.name || '')
    setEditEmail(user?.email || '')
    setEditFechaNacimiento(user?.fechaNacimiento || '')
    setEditing(true)
    setError('')
  }

  const handleSave = async () => {
    if (editFechaNacimiento) {
      const birthDate = new Date(editFechaNacimiento)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const m = today.getMonth() - birthDate.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      if (age < 18) {
        setError('Debes ser mayor de 18 años')
        return
      }
    }
    setError('')
    try {
      const updated = await updateUser.mutateAsync({ id: user.id, name: editName, email: editEmail, fechaNacimiento: editFechaNacimiento })
      setUser(updated)
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    }
  }

  const handleCancel = () => {
    setEditing(false)
  }

  if (!user) return null

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Configuración" description="Administrá tu cuenta y preferencias" />

      <div className="flex gap-6">
        <nav className="hidden md:flex flex-col gap-1 w-48 shrink-0">
          {SECTIONS.map((s) => <NavItem key={s.id} section={s} active={activeSection} onSelect={setActiveSection} />)}
        </nav>

        <div className="flex-1 min-w-0">
          {/* Mobile tabs */}
          <div className="flex md:hidden gap-1 overflow-x-auto pb-3 mb-2">
            {SECTIONS.map((s) => {
              const Icon = s.icon
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
                    activeSection === s.id
                      ? 'bg-violet-500/10 text-violet-300 font-medium'
                      : 'text-slate-400 hover:text-white bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {s.label}
                </button>
              )
            })}
          </div>

          {/* Profile Section */}
          {activeSection === 'profile' && (
            <section aria-label="Perfil" className="space-y-6">
              <div className="rounded-xl border border-white/5 bg-card p-6 space-y-6">
                <div className="flex items-center justify-between pb-6 border-b border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                      <span className="text-2xl font-bold text-violet-400">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{user.name}</h2>
                      <p className="text-sm text-slate-400">{user.email}</p>
                    </div>
                  </div>
                  {!editing && (
                    <Button variant="outline" size="sm" className="gap-2 border-white/10" onClick={handleStartEdit}>
                      <Pencil className="w-3.5 h-3.5" />
                      Editar
                    </Button>
                  )}
                </div>

                {error && editing && (
                  <div className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2 mb-4">
                    {error}
                  </div>
                )}
                {editing ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Nombre</Label>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1.5" />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="mt-1.5" />
                    </div>
                    <div>
                      <Label>Fecha de Nacimiento</Label>
                      <Input type="date" value={editFechaNacimiento} onChange={(e) => setEditFechaNacimiento(e.target.value)} className="mt-1.5" />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button onClick={handleSave} className="bg-indigo-500 hover:bg-indigo-400 text-white gap-2" disabled={updateUser.isPending}>
                        {updateUser.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        {updateUser.isPending ? 'Guardando...' : 'Guardar cambios'}
                      </Button>
                      <Button variant="outline" className="border-white/10" onClick={handleCancel}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Nombre</p>
                        <p className="text-sm text-white">{user.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                        <Mail className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Email</p>
                        <p className="text-sm text-white">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Fecha de Nacimiento</p>
                        <p className="text-sm text-white">{user.fechaNacimiento ? formatDateUTC(user.fechaNacimiento) : 'No especificada'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Miembro desde</p>
                        <p className="text-sm text-white">{formatDate(user.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                        <Shield className="w-4 h-4 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-2">Roles</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {roles.map((role) => (
                            <StatusBadge key={role} variant={role === 'ADMIN' ? 'default' : role === 'CREATOR' ? 'warning' : 'info'}>
                              {role}
                            </StatusBadge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <InvestorLevelCard />
              <WalletPanel />
            </section>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <section aria-label="Seguridad" className="space-y-6">
              <div className="rounded-xl border border-white/5 bg-card p-6 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">Cambiar contraseña</h2>
                    <p className="text-xs text-slate-500">Actualizá la contraseña de tu cuenta</p>
                  </div>
                </div>

                {success && (
                  <div className="text-sm text-emerald-400 bg-emerald-500/10 rounded-lg px-3 py-2">
                    {success}
                  </div>
                )}
                {error && (
                  <div className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-sm">
                  <div className="space-y-1.5">
                    <Label htmlFor="currentPassword">Contraseña actual</Label>
                    <PasswordInput
                      id="currentPassword"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="newPassword">Nueva contraseña</Label>
                    <PasswordInput
                      id="newPassword"
                      required
                      minLength={8}
                      placeholder="Ingresar contraseña"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      * Mínimo 8 caracteres, 1 mayúscula, 1 número y 1 carácter especial (@#$%^&+=!)
                    </p>
                  </div>
                  <Button type="submit" className="bg-indigo-500 hover:bg-indigo-400 text-white" disabled={passwordLoading}>
                    {passwordLoading ? 'Actualizando...' : 'Actualizar contraseña'}
                  </Button>
                </form>
              </div>

              <div className="rounded-xl border border-white/5 bg-card p-6 space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">Autenticación de dos factores</h2>
                    <p className="text-xs text-slate-500">Protegé tu cuenta con 2FA</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">Próximamente</p>
                    <p className="text-xs text-slate-500">Añadí una capa extra de seguridad a tu cuenta</p>
                  </div>
                  <div className="w-10 h-6 rounded-full bg-white/5 border border-white/10 flex items-center px-0.5">
                    <div className="w-5 h-5 rounded-full bg-slate-600" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-red-300">Zona de peligro</h2>
                    <p className="text-xs text-red-400/70">Acciones irreversibles</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-200">Eliminar cuenta</p>
                    <p className="text-xs text-red-400/70">Esta acción no se puede deshacer</p>
                  </div>
                  <Button variant="outline" size="sm" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                    Eliminar
                  </Button>
                </div>
              </div>
            </section>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <section aria-label="Notificaciones">
              <div className="rounded-xl border border-white/5 bg-card p-6 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">Notificaciones</h2>
                    <p className="text-xs text-slate-500">Configurá cómo y cuándo recibir notificaciones</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { key: 'email', label: 'Notificaciones por email', desc: 'Recibí emails sobre actividad en tu cuenta' },
                    { key: 'push', label: 'Notificaciones push', desc: 'Recibí notificaciones en tu navegador' },
                    { key: 'marketing', label: 'Comunicaciones comerciales', desc: 'Novedades y actualizaciones de la plataforma' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                      <Switch
                        checked={notifications[item.key]}
                        onCheckedChange={(v) => setNotifications({ ...notifications, [item.key]: v })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* API Keys Section */}
          {activeSection === 'api' && (
            <section aria-label="API Keys">
              <div className="rounded-xl border border-white/5 bg-card p-6 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                  <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Key className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">API Keys</h2>
                    <p className="text-xs text-slate-500">Gestioná tus claves de API para integraciones</p>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Key className="w-8 h-8 text-slate-500 mb-3" />
                  <p className="text-sm text-white mb-1">Próximamente</p>
                  <p className="text-xs text-slate-500">Las API keys te permitirán integrar la plataforma con tus herramientas</p>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
