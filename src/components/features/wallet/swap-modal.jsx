import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useWalletSummary } from '@/hooks/use-wallet'
import { useConfig, useWriteContract, useReadContract } from 'wagmi'
import { waitForTransactionReceipt } from '@wagmi/core'
import { parseUnits, formatUnits } from 'viem'
import { ERC20_ABI, IDEA_SWAP_ABI } from '@/lib/abis'
import { apiRequest } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'
import { toast } from 'sonner'
import { Loader2, ArrowDownUp, AlertTriangle, CheckCircle2 } from 'lucide-react'

const inputClass = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors'
const inputErrorClass = 'w-full bg-white/5 border border-red-500 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500 transition-colors ring-1 ring-red-500'

export function SwapModal({ open, onOpenChange }) {
  const { data: walletData, refetch } = useWalletSummary()
  const saldoIdea = walletData?.balances?.idea ?? 0

  const [cantidadIdea, setCantidadIdea] = useState('')
  const [errors, setErrors] = useState({})
  const [isConfirming, setIsConfirming] = useState(false)
  const [isTxPending, setIsTxPending] = useState(false)

  const config = useConfig()
  const { writeContractAsync } = useWriteContract()

  const swapAddress = import.meta.env.VITE_IDEA_SWAP_ADDRESS
  const ideaAddress = import.meta.env.VITE_IDEA_TOKEN_ADDRESS

  // Estimate USDC output
  const amountInWei = cantidadIdea && !isNaN(cantidadIdea) ? parseUnits(String(cantidadIdea), 18) : 0n
  // El contrato cobra un 0.05% de fee (5 bps) sobre el amount de entrada.
  // Para que el contrato no intente cobrar amountInWei + fee (y tire error de allowance o exceda el balance),
  // calculamos el monto neto de entrada descontando el fee: amountInWeiNet * 10005 / 10000 = amountInWei
  const amountInWeiNet = amountInWei > 0n ? (amountInWei * 10000n) / 10005n : 0n

  const { data: amountsOutData, isLoading: isEstimating } = useReadContract({
    address: swapAddress,
    abi: IDEA_SWAP_ABI,
    functionName: 'getAmountsOut',
    args: [amountInWeiNet, true], // ideaToUsdc = true
    query: {
      enabled: amountInWeiNet > 0n && !!swapAddress,
    }
  })

  // amountsOutData = [amountOut, fee]
  const usdcEstimatedWei = amountsOutData?.[0] ?? 0n
  const usdcEstimatedStr = amountsOutData ? formatUnits(usdcEstimatedWei, 18) : '0'

  const handleClose = (val) => {
    if (!val && !isTxPending) {
      setCantidadIdea('')
      setErrors({})
      setIsConfirming(false)
    }
    if (!isTxPending) {
      onOpenChange(val)
    }
  }

  const handleInitialSubmit = (e) => {
    e.preventDefault()
    setErrors({})

    const qty = Number(cantidadIdea)
    if (!qty || qty <= 0) {
      setErrors({ cantidad: 'La cantidad debe ser mayor a 0' })
      return
    }
    if (qty > Number(saldoIdea)) {
      setErrors({ cantidad: `Saldo insuficiente. Tenés ${Number(saldoIdea).toLocaleString()} $IDEA` })
      return
    }
    if (!swapAddress) {
      toast.error('Falta configurar VITE_IDEA_SWAP_ADDRESS en el archivo .env')
      return
    }

    setIsConfirming(true)
  }

  const handleConfirm = async () => {
    setErrors({})
    setIsTxPending(true)
    try {
      toast.loading('Aprobando el uso de $IDEA...', { id: 'swap_tx' })
      
      // 1. Approve IDEA token
      const approveHash = await writeContractAsync({
        address: ideaAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [swapAddress, amountInWei],
      })
      await waitForTransactionReceipt(config, { hash: approveHash })

      toast.loading('Ejecutando el Swap en la red...', { id: 'swap_tx' })
      
      // 2. Swap IDEA for exact USDC
      const swapHash = await writeContractAsync({
        address: swapAddress,
        abi: IDEA_SWAP_ABI,
        functionName: 'swapIdeaForExactUsdc',
        args: [usdcEstimatedWei],
      })
      await waitForTransactionReceipt(config, { hash: swapHash })

      // 3. Register swap in backend history
      try {
        await apiRequest(API_ENDPOINTS.WALLET_RECORD_SWAP, {
          method: 'POST',
          body: {
            amountIdea: cantidadIdea,
            amountUsdc: usdcEstimatedStr,
            txHash: swapHash
          }
        })
      } catch (backendError) {
        console.error("No se pudo registrar el swap en el backend:", backendError)
        // No bloqueamos al usuario si falla el backend porque el on-chain ya paso
      }

      toast.success('Swap realizado con éxito. ¡Ya tenés tus USDC!', { id: 'swap_tx' })
      refetch() // Refresh wallet balances
      handleClose(false)
    } catch (error) {
      toast.dismiss('swap_tx')
      const msg = error?.shortMessage || error?.message || 'Error desconocido'
      if (msg.includes('User rejected')) {
        toast.error('Transacción rechazada por el usuario')
      } else {
        toast.error(`Error en el Swap: ${msg}`)
      }
    } finally {
      setIsTxPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowDownUp className="w-5 h-5 text-emerald-400" />
            Retirar Ganancias (Swap)
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Cambiá tus tokens <span className="text-amber-400 font-semibold">$IDEA</span> por 
            <span className="text-emerald-400 font-semibold"> USDC</span> al instante.
          </DialogDescription>
        </DialogHeader>

        {!isConfirming ? (
          <form onSubmit={handleInitialSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-300">
                  Cantidad a enviar ($IDEA)
                </label>
                <span className="text-xs text-slate-500">
                  Disponible: {Number(saldoIdea).toLocaleString()}
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className={`${errors.cantidad ? inputErrorClass : inputClass} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none pr-12`}
                  value={cantidadIdea}
                  onChange={(e) => setCantidadIdea(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setCantidadIdea(String(saldoIdea))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-violet-400 hover:text-violet-300 font-medium"
                >
                  MÁX
                </button>
              </div>
              {errors.cantidad && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {errors.cantidad}
                </p>
              )}
            </div>

            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex flex-col gap-1 items-center justify-center">
               <ArrowDownUp className="w-4 h-4 text-emerald-500/50 mb-1" />
               <span className="text-xs text-slate-400">Recibirás aproximadamente:</span>
               <div className="flex items-center gap-2">
                  {isEstimating ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  ) : (
                    <span className="text-2xl font-bold text-emerald-400">
                      {Number(usdcEstimatedStr).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                  )}
                  <span className="text-sm text-emerald-400/80 font-semibold">USDC</span>
               </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={() => handleClose(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-violet-600 hover:bg-violet-500 text-white">
                Continuar
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6 pt-4">
            <div className="rounded-lg bg-white/5 border border-white/10 p-4 space-y-3">
              <h4 className="text-sm font-medium text-slate-300 mb-2">Resumen del Swap</h4>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Enviás</span>
                <span className="font-semibold text-amber-400 flex items-center gap-1">
                  {Number(cantidadIdea).toLocaleString()} $IDEA
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Recibís</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  {Number(usdcEstimatedStr).toLocaleString(undefined, { maximumFractionDigits: 2 })} USDC
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsConfirming(false)}
                disabled={isTxPending}
              >
                Atrás
              </Button>
              <Button 
                onClick={handleConfirm}
                disabled={isTxPending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white min-w-[140px]"
              >
                {isTxPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Confirmar Swap
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
