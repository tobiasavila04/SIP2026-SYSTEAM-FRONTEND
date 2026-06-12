import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useBuyListing } from '@/hooks/use-marketplace'
import { useWalletSummary } from '@/hooks/use-wallet'
import { formatCurrency } from '@/lib/utils'
import { Loader2, ShoppingCart, AlertTriangle } from 'lucide-react'
import { useConfig, useWriteContract } from 'wagmi'
import { waitForTransactionReceipt } from '@wagmi/core'
import { parseUnits } from 'viem'
import { ERC20_ABI, IDEA_MARKETPLACE_ABI } from '@/lib/abis'
import { toast } from 'sonner'

// Helper function to safely parse potential Wei values
function parseWei(val) {
  if (!val) return 0
  const num = Number(val)
  if (num >= 1e9) return num / 1e18
  return num
}

export function BuyListingModal({ open, onOpenChange, listing }) {
  const { data: walletData } = useWalletSummary()
  const userSaldoIdea = walletData?.balances?.idea ?? 0
  
  const [cantidad, setCantidad] = useState('')
  const [errors, setErrors] = useState({})
  const [isConfirming, setIsConfirming] = useState(false)
  const [isTxPending, setIsTxPending] = useState(false)
  const buyListing = useBuyListing()

  const config = useConfig()
  const { writeContractAsync } = useWriteContract()

  // Reset state when modal opens/closes or listing changes
  useEffect(() => {
    if (open) {
      setCantidad('')
      setErrors({})
      setIsConfirming(false)
    }
  }, [open, listing])

  if (!listing) return null

  const maxAvailable = parseWei(listing.cantidad)
  const unitPrice = parseWei(listing.precioUnitario ?? listing.precioPorToken)
  const totalCost = Number(cantidad || 0) * unitPrice

  const handleInitialSubmit = (e) => {
    e.preventDefault()
    setErrors({})
    
    const qty = Number(cantidad)
    const newErrors = {}
    
    if (!qty || qty <= 0) {
      newErrors.cantidad = 'La cantidad debe ser mayor a 0'
    } else if (qty > maxAvailable) {
      newErrors.cantidad = `Solo hay ${maxAvailable.toLocaleString()} sub-tokens disponibles`
    } else if (totalCost > userSaldoIdea) {
      newErrors.cantidad = `No tenés suficiente $IDEA. Necesitás ${formatCurrency(totalCost)} pero tenés ${formatCurrency(userSaldoIdea)}`
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    // Move to confirmation step
    setIsConfirming(true)
  }

  const handleConfirm = async () => {
    setErrors({})
    setIsTxPending(true)
    try {
      const marketplaceAddress = import.meta.env.VITE_IDEA_MARKETPLACE_ADDRESS
      const ideaAddress = import.meta.env.VITE_IDEA_TOKEN_ADDRESS
      const amountWei = parseUnits(String(cantidad), 18)
      const totalCostWei = parseUnits(String(totalCost), 18)
      
      toast.loading('Aprobando el gasto de $IDEA...', { id: 'buy_tx' })
      const approveHash = await writeContractAsync({
        address: ideaAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [marketplaceAddress, totalCostWei],
      })
      await waitForTransactionReceipt(config, { hash: approveHash })
      
      toast.loading('Confirmando la compra en la red...', { id: 'buy_tx' })
      const buyTxHash = await writeContractAsync({
        address: marketplaceAddress,
        abi: IDEA_MARKETPLACE_ABI,
        functionName: 'buyTokens',
        args: [BigInt(listing.onChainId || listing.id), amountWei],
      })
      await waitForTransactionReceipt(config, { hash: buyTxHash })

      toast.loading('Guardando en el servidor...', { id: 'buy_tx' })
      await buyListing.mutateAsync({
        id: listing.id,
        cantidad: Math.round(Number(cantidad)),
        txHash: buyTxHash,
      })
      
      toast.success('Compra de sub-tokens procesada con xito', { id: 'buy_tx' })
      onOpenChange(false)
    } catch (error) {
      toast.dismiss('buy_tx')
      if (error?.fieldErrors) {
        setErrors(error.fieldErrors)
      } else {
        setErrors({ general: error?.message || error?.shortMessage || 'Error al procesar la compra' })
      }
    } finally {
      setIsTxPending(false)
    }
  }

  const project = listing.projectName ?? `Sub-token #${listing.subtokenId}`
  const seller = listing.sellerName ?? `Vendedor #${listing.sellerId}`

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val)
      if (!val) {
        setErrors({})
        setIsConfirming(false)
      }
    }}>
      <DialogContent className="sm:max-w-md">
        {isConfirming ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Confirmar Compra
              </DialogTitle>
              <DialogDescription className="text-sm pt-2">
                Estás a punto de gastar <strong className="text-emerald-400">{formatCurrency(totalCost)}</strong> de tu saldo de $IDEA para comprar <strong className="text-slate-200">{cantidad}</strong> sub-tokens de <strong className="text-slate-200">{project}</strong>.
                <br /><br />
                ¿Estás seguro de que deseas confirmar esta operación?
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsConfirming(false)}
                className="cursor-pointer border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                disabled={isTxPending || buyListing.isPending}
              >
                Volver
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={isTxPending || buyListing.isPending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white min-w-[100px] cursor-pointer"
              >
                {isTxPending || buyListing.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Procesando...
                  </>
                ) : 'Confirmar y Pagar'}
              </Button>
            </div>
            {errors.general && (
              <span className="text-xs text-red-500 font-medium mt-2 text-center block">{errors.general}</span>
            )}
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-violet-500" />
                Comprar Sub-tokens
              </DialogTitle>
              <DialogDescription className="text-xs">
                Ingresa la cantidad de sub-tokens que deseas adquirir de esta orden.
              </DialogDescription>
            </DialogHeader>
            
            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-lg space-y-2 text-sm mt-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Proyecto:</span>
                <span className="text-white font-medium">{project}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vendedor:</span>
                <span className="text-slate-300 capitalize">{seller}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Precio unitario:</span>
                <span className="text-emerald-400 font-medium">{formatCurrency(unitPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Disponibles:</span>
                <span className="text-white font-mono">{maxAvailable.toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={handleInitialSubmit} noValidate className="space-y-4 mt-2">
              {/* Cantidad Input */}
              <div className="space-y-2 flex flex-col">
                <div className="flex justify-between items-center">
                  <Label htmlFor="cantidad" className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Cantidad a Comprar</Label>
                  <span className="text-[10px] text-slate-500">Tu saldo: {formatCurrency(userSaldoIdea)}</span>
                </div>
                <div className="relative">
                  <Input
                    id="cantidad"
                    type="number"
                    min="1"
                    max={maxAvailable}
                    step="1"
                    placeholder={`Máx: ${maxAvailable.toLocaleString()}`}
                    value={cantidad}
                    onChange={(e) => {
                      setCantidad(e.target.value)
                      setErrors((prev) => ({ ...prev, cantidad: undefined }))
                    }}
                    className={`bg-white text-black transition-colors pr-16 ${errors.cantidad ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCantidad(String(maxAvailable))
                      setErrors((prev) => ({ ...prev, cantidad: undefined }))
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-violet-600 bg-violet-100 hover:bg-violet-200 px-2 py-1 rounded cursor-pointer transition-colors"
                  >
                    MAX
                  </button>
                </div>
                {errors.cantidad && (
                  <span className="text-xs text-red-500 font-medium mt-1">{errors.cantidad}</span>
                )}
              </div>
              
              {/* Total Cost Preview */}
              <div className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-lg flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Total a pagar:</span>
                <span className="text-slate-900 dark:text-white font-bold text-base">{formatCurrency(totalCost)}</span>
              </div>
              
              {/* Buttons */}
              <div className="flex gap-3 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false)
                  }}
                  className="cursor-pointer border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={buyListing.isPending}
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
