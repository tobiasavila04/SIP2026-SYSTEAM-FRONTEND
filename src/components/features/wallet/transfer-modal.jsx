import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useTransferTokens, useWalletSummary } from '@/hooks/use-wallet'
import { useConfig, useWriteContract } from 'wagmi'
import { waitForTransactionReceipt } from '@wagmi/core'
import { parseUnits } from 'viem'
import { ERC20_ABI } from '@/lib/abis'
import { apiRequest } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'
import { useAuthStore } from '@/stores/auth-store'
import { toast } from 'sonner'
import { Loader2, Send, AlertTriangle, CheckCircle2 } from 'lucide-react'

const inputClass = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors'
const inputErrorClass = 'w-full bg-white/5 border border-red-500 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500 transition-colors ring-1 ring-red-500'

export function TransferModal({ open, onOpenChange }) {
  const { data: walletData } = useWalletSummary()
  const saldoIdea = walletData?.balances?.idea ?? 0
  const currentUserId = useAuthStore((s) => s.user?.id)

  const [usernameQuery, setUsernameQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [recipient, setRecipient] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)

  const [cantidad, setCantidad] = useState('')
  const [errors, setErrors] = useState({})
  const [isConfirming, setIsConfirming] = useState(false)
  const [isTxPending, setIsTxPending] = useState(false)

  const dropdownRef = useRef(null)
  const config = useConfig()
  const { writeContractAsync } = useWriteContract()
  const transferTokens = useTransferTokens()

  // Debounced search
  useEffect(() => {
    if (!usernameQuery.trim() || usernameQuery.length < 2) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }
    if (recipient) return

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await apiRequest(API_ENDPOINTS.USERS_SEARCH, {
          params: { username: usernameQuery.trim() },
        })
        const list = Array.isArray(results) ? results : results?.content ?? []
        const filtered = list.filter((u) => u.id !== currentUserId && u.walletAddress)
        setSuggestions(filtered)
        setShowDropdown(filtered.length > 0)
      } catch {
        setSuggestions([])
        setShowDropdown(false)
      } finally {
        setIsSearching(false)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [usernameQuery, currentUserId, recipient])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSelectRecipient = (user) => {
    setRecipient(user)
    setUsernameQuery(user.username)
    setShowDropdown(false)
    setSuggestions([])
    setErrors((prev) => ({ ...prev, username: undefined }))
  }

  const handleClose = (val) => {
    if (!val) {
      setUsernameQuery('')
      setCantidad('')
      setErrors({})
      setRecipient(null)
      setSuggestions([])
      setShowDropdown(false)
      setIsConfirming(false)
    }
    onOpenChange(val)
  }

  const handleInitialSubmit = (e) => {
    e.preventDefault()
    setErrors({})

    if (!recipient) {
      setErrors({ username: 'Seleccioná un destinatario de la lista' })
      return
    }
    const qty = Number(cantidad)
    if (!qty || qty <= 0) {
      setErrors({ cantidad: 'La cantidad debe ser mayor a 0' })
      return
    }
    if (qty > Number(saldoIdea)) {
      setErrors({ cantidad: `Saldo insuficiente. Tenés ${Number(saldoIdea).toLocaleString()} $IDEA` })
      return
    }

    setIsConfirming(true)
  }

  const handleConfirm = async () => {
    setErrors({})
    setIsTxPending(true)
    try {
      const ideaAddress = import.meta.env.VITE_IDEA_TOKEN_ADDRESS
      const amountWei = parseUnits(String(cantidad), 18)

      toast.loading('Confirmando transferencia en la red...', { id: 'transfer_tx' })
      const txHash = await writeContractAsync({
        address: ideaAddress,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [recipient.walletAddress, amountWei],
      })
      const receipt = await waitForTransactionReceipt(config, { hash: txHash })

      toast.loading('Guardando en el servidor...', { id: 'transfer_tx' })
      await transferTokens.mutateAsync({
        destinatarioId: recipient.id,
        cantidad: Number(cantidad),
        txHash,
        walletEmisor: receipt.from,
      })

      toast.success('Transferencia realizada con éxito', { id: 'transfer_tx' })
      handleClose(false)
    } catch (error) {
      toast.dismiss('transfer_tx')
      const msg = error?.shortMessage || error?.message || ''
      if (msg.toLowerCase().includes('user rejected') || msg.toLowerCase().includes('denied')) {
        toast.error('Transacción cancelada por el usuario')
        return
      }
      if (error?.fieldErrors) {
        setErrors(error.fieldErrors)
      } else {
        setErrors({ general: msg || 'Error al procesar la transferencia' })
      }
    } finally {
      setIsTxPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {isConfirming ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Confirmar Transferencia
              </DialogTitle>
              <DialogDescription className="text-sm pt-2">
                Esta operación queda registrada en la blockchain y no se puede revertir.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-lg space-y-2 text-sm mt-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Destinatario:</span>
                <span className="text-white font-medium">{recipient?.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Wallet:</span>
                <span className="text-slate-400 font-mono text-xs truncate max-w-[180px]">
                  {recipient?.walletAddress}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cantidad:</span>
                <span className="text-violet-400 font-bold">{Number(cantidad).toLocaleString()} $IDEA</span>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsConfirming(false)}
                disabled={isTxPending || transferTokens.isPending}
                className="cursor-pointer border-slate-700 hover:bg-slate-800"
              >
                Volver
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={isTxPending || transferTokens.isPending}
                className="bg-violet-600 hover:bg-violet-500 text-white min-w-[120px] cursor-pointer"
              >
                {isTxPending || transferTokens.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Procesando...
                  </>
                ) : 'Confirmar'}
              </Button>
            </div>
            {errors.general && (
              <span className="text-xs text-red-500 font-medium mt-2 text-center block">
                {errors.general}
              </span>
            )}
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="w-5 h-5 text-violet-500" />
                Transferir $IDEA
              </DialogTitle>
              <DialogDescription className="text-xs">
                Buscá el usuario destinatario e ingresá la cantidad a transferir.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleInitialSubmit} noValidate className="space-y-4 mt-2">
              {/* Buscador con autocomplete */}
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Destinatario
                </label>
                <div className="relative" ref={dropdownRef}>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Escribí el nombre o email..."
                      value={usernameQuery}
                      onChange={(e) => {
                        setUsernameQuery(e.target.value)
                        setRecipient(null)
                        setErrors((prev) => ({ ...prev, username: undefined }))
                      }}
                      onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                      className={errors.username ? inputErrorClass : inputClass}
                      autoComplete="off"
                    />
                    {isSearching && (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    )}
                  </div>

                  {/* Dropdown de sugerencias */}
                  {showDropdown && suggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 rounded-lg shadow-xl overflow-hidden border border-white/10" style={{ backgroundColor: 'rgb(15 23 42)' }}>
                      {suggestions.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleSelectRecipient(user)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left cursor-pointer"
                          style={{ backgroundColor: 'transparent' }}
                        >
                          <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-violet-400">
                              {user.username?.[0]?.toUpperCase() ?? '?'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium" style={{ color: 'white' }}>{user.username}</p>
                            <p className="text-xs font-mono truncate" style={{ color: 'rgb(100 116 139)' }}>{user.walletAddress}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {errors.username && (
                  <span className="text-xs text-red-500 font-medium">{errors.username}</span>
                )}

                {/* Usuario seleccionado */}
                {recipient && (
                  <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-white font-medium">{recipient.username}</p>
                      <p className="text-slate-400 font-mono text-xs truncate">{recipient.walletAddress}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Cantidad */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Cantidad ($IDEA)
                  </label>
                  <span className="text-[10px] text-slate-500">
                    Saldo: {Number(saldoIdea).toLocaleString()} $IDEA
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  placeholder="Ej: 100"
                  value={cantidad}
                  onChange={(e) => {
                    setCantidad(e.target.value)
                    setErrors((prev) => ({ ...prev, cantidad: undefined }))
                  }}
                  className={errors.cantidad ? inputErrorClass : inputClass}
                />
                {errors.cantidad && (
                  <span className="text-xs text-red-500 font-medium">{errors.cantidad}</span>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleClose(false)}
                  className="cursor-pointer border-slate-700 hover:bg-slate-800"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-violet-600 hover:bg-violet-500 text-white cursor-pointer"
                >
                  Continuar
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
