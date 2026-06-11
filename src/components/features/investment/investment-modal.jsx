import { useState, useEffect, useCallback, useRef } from 'react'
import { useAccount, useWriteContract, useConfig } from 'wagmi'
import { waitForTransactionReceipt } from '@wagmi/core'
import { parseUnits } from 'viem'
import { INVESTMENT_SWAP_ABI, ERC20_ABI } from '@/lib/abis'
import { useTokenPrice, useTokenInfo, useValidateInvestment, useCreateInvestment } from '@/hooks/use-investment'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { TxHashLink } from '@/components/shared/tx-hash-link'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Loader2, CheckCircle2, AlertTriangle, TrendingUp,
  Coins, XCircle, RefreshCw, Ban, ArrowRight,
  Zap, Sparkles
} from 'lucide-react'

const QUICK_SUBTOKENS = [1, 5, 10, 50]
function StateLoading({ message, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 space-y-5">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-violet-500/10 animate-ping" />
        <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center border border-violet-500/20">
          <Loader2 className="w-7 h-7 animate-spin text-violet-400" />
        </div>
      </div>
      <div className="text-center max-w-xs">
        <p className="text-sm font-medium text-slate-200">{message}</p>
        {sub && <p className="text-xs text-slate-500 mt-2 leading-relaxed">{sub}</p>}
      </div>
    </div>
  )
}

function StateSuccess({ amount, subtokens, projectTitle, txHash, onClose, symbol }) {
  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col items-center py-6 space-y-4">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400/20 to-green-500/20 flex items-center justify-center border border-emerald-500/30">
            <CheckCircle2 className="w-9 h-9 text-emerald-400" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-white">Inversión confirmada</p>
          <p className="text-sm text-slate-400 mt-1.5">en {projectTitle}</p>
        </div>
      </div>
      <div className="rounded-xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 divide-y divide-white/5 overflow-hidden">
        <div className="flex justify-between items-center px-5 py-3.5">
          <span className="text-sm text-slate-400">Monto invertido</span>
          <span className="text-sm font-semibold text-white">{Number(amount).toLocaleString()} <span className="text-xs text-slate-500">$IDEA</span></span>
        </div>
        {subtokens != null && (
          <div className="flex justify-between items-center px-5 py-3.5">
            <span className="text-sm text-slate-400">{symbol} recibidos</span>
            <span className="text-sm font-semibold text-emerald-300">{subtokens.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between items-center px-5 py-3.5">
          <span className="text-sm text-slate-400">Transacción</span>
          <TxHashLink hash={txHash} />
        </div>
      </div>
      <div className="rounded-xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-400 leading-relaxed">
            Los {symbol} aparecerán en tu wallet y en la sección de inversiones. Podés hacer seguimiento desde el panel de control.
          </p>
        </div>
      </div>
      <Button
        onClick={onClose}
        className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-medium shadow-lg shadow-violet-600/20 transition-all duration-200"
      >
        Cerrar
      </Button>
    </div>
  )
}

function StateError({ message, balance, required, onRetry, onClose }) {
  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col items-center py-6 space-y-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500/20 to-rose-500/20 flex items-center justify-center border border-red-500/30">
          <XCircle className="w-9 h-9 text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-white">Error en la inversión</p>
          <p className="text-sm text-slate-400 mt-1.5 max-w-xs mx-auto">{message}</p>
        </div>
      </div>
      {balance != null && required != null && (
        <div className="rounded-xl bg-gradient-to-b from-red-500/5 to-transparent border border-red-500/10 divide-y divide-red-500/10 overflow-hidden">
          <div className="flex justify-between items-center px-5 py-3.5">
            <span className="text-sm text-slate-400">Tu saldo</span>
            <span className="text-sm font-semibold text-white">{Number(balance).toLocaleString()} <span className="text-xs text-slate-500">$IDEA</span></span>
          </div>
          <div className="flex justify-between items-center px-5 py-3.5">
            <span className="text-sm text-slate-400">Monto requerido</span>
            <span className="text-sm font-semibold text-red-300">{Number(required).toLocaleString()} <span className="text-xs text-red-400/60">$IDEA</span></span>
          </div>
        </div>
      )}
      <div className="flex gap-3">
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="flex-1 gap-2 h-11 rounded-xl border-white/10 hover:bg-white/5 hover:border-violet-500/30 transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            Intentar de nuevo
          </Button>
        )}
        <Button
          onClick={onClose}
          variant="ghost"
          className="flex-1 h-11 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200"
        >
          Cerrar
        </Button>
      </div>
    </div>
  )
}

export function InvestmentModal({ open, onOpenChange, projectId, projectTitle, simbolo, onSuccess }) {
  const [subtokenCount, setSubtokenCount] = useState('')
  const [step, setStep] = useState('form')
  const [investHash, setInvestHash] = useState(null)
  const [errorInfo, setErrorInfo] = useState(null)
  const inputRef = useRef(null)

  const { address, isConnected } = useAccount()

  const { data: tokenPrice, isLoading: loadingPrice } = useTokenPrice(projectId)
  const { data: tokenInfo } = useTokenInfo(projectId)
  const symbol = simbolo || tokenInfo?.simbolo || 'subtoken'
  const validateMutation = useValidateInvestment()
  const createInvestment = useCreateInvestment()

  const config = useConfig()
  const { writeContractAsync } = useWriteContract()

  const precioActual = tokenPrice?.precioActual
    ? Number(tokenPrice.precioActual)
    : tokenInfo?.precioActual
      ? Number(tokenInfo.precioActual)
      : null

  const cupoRestante = tokenPrice?.cupoRestante ?? tokenInfo?.cupoRestante ?? null
  const suministroTotal = tokenPrice?.suministroTotal ?? tokenInfo?.suministroTotal ?? null
  const cupoPct = cupoRestante != null && suministroTotal != null
    ? ((suministroTotal - cupoRestante) / suministroTotal) * 100
    : 0

  const numSubtokenCount = Number(subtokenCount) || 0
  const effectiveAmount = precioActual ? (numSubtokenCount * precioActual).toFixed(2) : ''
  const numEffectiveAmount = Number(effectiveAmount) || 0

  const validation = validateMutation.data
  const isValid = validation?.valido
  const validationMsg = validation?.mensaje
  const subTokensARecebir = validation?.subTokensARecebir

  useEffect(() => {
    if (effectiveAmount && numEffectiveAmount > 0 && projectId) {
      validateMutation.mutate({ proyectoId: projectId, montoIdea: numEffectiveAmount })
    }
  }, [effectiveAmount, projectId])

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const reset = useCallback(() => {
    setSubtokenCount('')
    setStep('form')
    setInvestHash(null)
    setErrorInfo(null)
    validateMutation.reset()
  }, [])

  const handleInvest = async () => {
    if (!effectiveAmount || isNaN(numEffectiveAmount) || numEffectiveAmount <= 0) {
      toast.error(`Ingresá una cantidad válida de ${symbol}`)
      return
    }
    if (!isConnected || !address) {
      toast.error('Conectá tu wallet primero')
      return
    }

    try {
      setStep('backend')
      
      const ideaTokenAddress = import.meta.env.VITE_IDEA_TOKEN_ADDRESS
      const swapAddress = import.meta.env.VITE_INVESTMENT_SWAP_ADDRESS
      const amountWei = parseUnits(String(numEffectiveAmount), 18)

      // 1. Approve
      const approveHash = await writeContractAsync({
        address: ideaTokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [swapAddress, amountWei],
      })

      await waitForTransactionReceipt(config, { hash: approveHash })

      // 2. Invest
      const investTxHash = await writeContractAsync({
        address: swapAddress,
        abi: INVESTMENT_SWAP_ABI,
        functionName: 'invest',
        args: [BigInt(projectId), amountWei],
      })

      await waitForTransactionReceipt(config, { hash: investTxHash })
      setInvestHash(investTxHash)

      await createInvestment.mutateAsync({
        proyectoId: projectId,
        montoIdea: numEffectiveAmount,
        txHash: investTxHash,
      })

      setStep('done')
      toast.success('Inversión realizada con éxito')
      onSuccess?.()
    } catch (e) {
      const msg = e?.message || ''
      if (msg.includes('User rejected') || msg.includes('user rejected')) {
        setErrorInfo({ message: 'Transacción cancelada' })
      } else {
        setErrorInfo({ message: msg || 'Error al procesar la inversión' })
      }
      setStep('error')
    }
  }

  const canInvest = isConnected && numEffectiveAmount > 0 && step === 'form'
  const investDisabled = !canInvest || (isValid === false) || validateMutation.isPending

  const handleClose = () => {
    if (step !== 'backend') {
      reset()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && step !== 'backend') handleClose(); else onOpenChange(v) }}>
      <DialogContent className="sm:max-w-md p-0 gap-0 bg-gradient-to-b from-[#0B0E1A] to-[#070912] border border-white/[0.06] shadow-2xl shadow-black/50">
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2.5 text-lg">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center border border-violet-500/20">
              <TrendingUp className="w-4 h-4 text-violet-400" />
            </div>
            <span className="text-white">Invertir</span>
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm pt-1">
            {step === 'done'
              ? 'Tu inversión se registró correctamente en la blockchain.'
              : step === 'error'
                ? 'Ocurrió un error al procesar la inversión.'
                : isConnected
                  ? `Comprá ${symbol} de ${projectTitle} con tus $IDEA.`
                  : 'Conectá tu wallet para empezar a invertir.'}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4">
          {step === 'done' && investHash ? (
            <StateSuccess
              amount={effectiveAmount}
              subtokens={subTokensARecebir}
              projectTitle={projectTitle}
              txHash={investHash}
              onClose={() => { reset(); onOpenChange(false) }}
              symbol={symbol}
            />
          ) : step === 'error' ? (
            <StateError
              message={errorInfo?.message || 'Ocurrió un error'}
              balance={errorInfo?.balance}
              required={errorInfo?.required}
              onRetry={() => { setStep('form'); setErrorInfo(null) }}
              onClose={() => { reset(); onOpenChange(false) }}
            />
          ) : step === 'backend' ? (
            <StateLoading
              message="Procesando inversión..."
              sub="Guardando los datos de la transacción en la plataforma."
            />
          ) : (
            <div className="space-y-4">

              {/* Price card */}
              {loadingPrice ? (
                <div className="flex items-center gap-2.5 text-xs text-slate-500 py-3 px-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
                  Cargando precio del {symbol}...
                </div>
              ) : precioActual != null && (
                <div className="rounded-xl bg-gradient-to-b from-white/[0.03] to-transparent border border-white/5 overflow-hidden">
                  <div className="grid grid-cols-2 divide-x divide-white/5">
                    <div className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                        <Coins className="w-3 h-3" />
                        Precio base
                      </div>
                      <p className="text-base font-bold text-white">
                        ${tokenPrice?.precioBase != null ? Number(tokenPrice.precioBase).toFixed(2) : '—'}
                      </p>
                      <p className="text-[10px] text-slate-600">$IDEA</p>
                    </div>
                    <div className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                        <TrendingUp className="w-3 h-3" />
                        Precio actual
                      </div>
                      <p className="text-base font-bold text-white">${precioActual.toFixed(2)}</p>
                      <p className="text-[10px] text-slate-600">$IDEA</p>
                    </div>
                  </div>
                  {/* Cupo bar */}
                  {cupoRestante != null && suministroTotal != null && (
                    <div className="px-4 pb-4">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase tracking-wider mb-2">
                        <span>Cupo disponible</span>
                        <span className="font-medium text-slate-400">{cupoRestante.toLocaleString()} / {suministroTotal.toLocaleString()}</span>
                      </div>
                      <div className="relative w-full h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-500/60 to-fuchsia-500/60 transition-all duration-500 ease-out"
                          style={{ width: `${Math.min(cupoPct, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Subtoken input */}
              <div>
                <Label className="text-xs text-slate-400 font-medium">Cantidad de {symbol}</Label>
                <div className="relative mt-1.5">
                  <Input
                    ref={inputRef}
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={subtokenCount}
                    onChange={(e) => setSubtokenCount(e.target.value)}
                    disabled={!precioActual}
                    className="pl-3.5 h-11 rounded-xl bg-white/[0.03] border-white/10 text-white placeholder:text-slate-600 focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 transition-all duration-200 disabled:opacity-40"
                  />
                </div>
                {precioActual && numSubtokenCount > 0 && (
                  <p className="text-xs text-slate-500 mt-1.5">
                    Equivalente: <span className="font-medium text-slate-300">{Number(effectiveAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $IDEA</span>
                  </p>
                )}
              </div>

              {/* Quick subtoken buttons */}
              <div className="flex gap-2">
                {QUICK_SUBTOKENS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setSubtokenCount(String(q))}
                    className={cn(
                      'flex-1 py-2 text-xs font-semibold rounded-xl border transition-all duration-200',
                      Number(subtokenCount) === q
                        ? 'bg-gradient-to-b from-violet-500/20 to-violet-600/10 border-violet-500/30 text-violet-300 shadow-sm shadow-violet-500/10'
                        : 'bg-white/[0.02] border-white/5 text-slate-500 hover:border-violet-500/20 hover:text-violet-400 hover:bg-white/[0.04] active:scale-95'
                    )}
                  >
                    {q} {symbol}
                  </button>
                ))}
              </div>

              {/* Validation result */}
              {numEffectiveAmount > 0 && (
                <div className={cn(
                  'rounded-xl p-4 border transition-all duration-200',
                  isValid
                    ? 'bg-gradient-to-b from-emerald-500/8 to-transparent border-emerald-500/20'
                    : validationMsg
                      ? 'bg-gradient-to-b from-red-500/8 to-transparent border-red-500/20'
                      : 'bg-white/[0.02] border-white/5'
                )}>
                  {validateMutation.isPending ? (
                    <div className="flex items-center gap-2.5 text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                      <span className="text-sm">Validando inversión...</span>
                    </div>
                  ) : isValid ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          </div>
                          <p className="text-sm font-medium text-emerald-300">Inversión válida</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-emerald-400/50 shrink-0" />
                      </div>
                      {subTokensARecebir != null && (
                        <p className="text-xs text-emerald-400/70 leading-relaxed pl-9">
                          Con <span className="font-medium text-emerald-300">{numSubtokenCount.toLocaleString()}</span> {symbol}
                          {' '}necesitás <span className="font-medium text-emerald-300">{Number(effectiveAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $IDEA</span>.
                        </p>
                      )}
                    </div>
                  ) : validationMsg ? (
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
                        <Ban className="w-4 h-4 text-red-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-red-300">Inversión no válida</p>
                        <p className="text-xs text-red-400/60 mt-0.5">{validationMsg}</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Info box */}
              {!isConnected && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300/70 leading-relaxed">
                    Necesitás conectar tu wallet de MetaMask para poder invertir en proyectos.
                  </p>
                </div>
              )}

              {/* Submit button */}
              {!isConnected ? (
                <div className="flex justify-center pt-1">
                  <ConnectButton />
                </div>
              ) : (
                <Button
                  onClick={handleInvest}
                  disabled={investDisabled}
                  className={cn(
                    'w-full h-12 rounded-xl font-semibold text-sm transition-all duration-200',
                    'bg-gradient-to-r from-violet-600 to-fuchsia-600',
                    'hover:from-violet-500 hover:to-fuchsia-500',
                    'disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:opacity-70',
                    'shadow-lg shadow-violet-600/20 hover:shadow-violet-500/30',
                    'active:scale-[0.98]'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {validateMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    {validateMutation.isPending
                      ? 'Validando...'
                      : isValid === false
                        ? 'Inversión no válida'
                        : numEffectiveAmount > 0
                          ? `Invertir ${Number(effectiveAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $IDEA`
                          : `Ingresá cantidad de ${symbol}`}
                  </div>
                </Button>
              )}


            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
