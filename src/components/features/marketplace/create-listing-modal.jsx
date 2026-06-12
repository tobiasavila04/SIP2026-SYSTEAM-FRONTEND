import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateListing } from '@/hooks/use-marketplace'
import { useWalletSummary } from '@/hooks/use-wallet'
import { Skeleton } from '@/components/shared/loading-skeleton'
import { formatCurrency } from '@/lib/utils'
import { Loader2, Coins, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useConfig, useWriteContract } from 'wagmi'
import { waitForTransactionReceipt } from '@wagmi/core'
import { parseUnits } from 'viem'
import { ERC20_ABI, IDEA_MARKETPLACE_ABI } from '@/lib/abis'

function toWeiString(value) {
  const normalized = String(value).replace(',', '.');
  const [intPart, decPart = ''] = normalized.split('.');
  const decimals = decPart.padEnd(18, '0').slice(0, 18);
  return intPart + decimals;
}

export function CreateListingModal({ open, onOpenChange }) {
  const { data: walletData, isLoading: walletLoading } = useWalletSummary()
  const portfolio = walletData?.portfolio ?? []
  const [subtokenId, setSubtokenId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [precioPorToken, setPrecioPorToken] = useState('')
  const [errors, setErrors] = useState({})
  const [isConfirming, setIsConfirming] = useState(false)
  const [isTxPending, setIsTxPending] = useState(false)
  const createListing = useCreateListing()
  
  const config = useConfig()
  const { writeContractAsync } = useWriteContract()

  // Dynamic cost evaluation
  const total = Number(cantidad || 0) * Number(String(precioPorToken).replace(',', '.') || 0)

  const selectedTokenForValidation = portfolio.find(p => String(p.subtokenId) === String(subtokenId))
  const isInvalidState = selectedTokenForValidation && selectedTokenForValidation.proyectoEstado !== 'EJECUCION' && selectedTokenForValidation.proyectoEstado !== 'FINALIZADO'
  
  const handleInitialSubmit = (e) => {
    e.preventDefault()
    setErrors({})
    const newErrors = {}
    
    if (!subtokenId) {
      newErrors.subtoken = 'Por favor, selecciona un token para vender'
    }
    if (!cantidad || Number(cantidad) <= 0) {
      newErrors.cantidad = 'La cantidad debe ser mayor a 0'
    }
    if (!precioPorToken || Number(String(precioPorToken).replace(',', '.')) <= 0) {
      newErrors.precio = 'El precio unitario debe ser mayor a 0'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    if (isInvalidState) {
      return
    }
    
    // Move to confirmation step
    setIsConfirming(true)
  }

  const handleConfirm = async () => {
    setErrors({})
    setIsTxPending(true)
    try {
      const selectedToken = portfolio.find(p => String(p.subtokenId) === String(subtokenId))
      if (!selectedToken || !selectedToken.contractAddress) {
         throw new Error("No se pudo encontrar la direccin del token en la blockchain")
      }
      
      const subtokenAddress = selectedToken.contractAddress
      const marketplaceAddress = import.meta.env.VITE_IDEA_MARKETPLACE_ADDRESS
      const amountWei = parseUnits(String(cantidad), 18)
      const priceWei = parseUnits(String(precioPorToken).replace(',', '.'), 18)
      
      toast.loading('Aprobando el uso de tokens...', { id: 'list_tx' })
      const approveHash = await writeContractAsync({
        address: subtokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [marketplaceAddress, amountWei],
      })
      await waitForTransactionReceipt(config, { hash: approveHash })
      
      toast.loading('Publicando en el marketplace...', { id: 'list_tx' })
      const listTxHash = await writeContractAsync({
        address: marketplaceAddress,
        abi: IDEA_MARKETPLACE_ABI,
        functionName: 'listTokens',
        args: [subtokenAddress, amountWei, priceWei],
      })
      await waitForTransactionReceipt(config, { hash: listTxHash })
      
      toast.loading('Guardando en el servidor...', { id: 'list_tx' })
      await createListing.mutateAsync({
        subtokenId: Number(subtokenId),
        cantidad: Math.round(Number(cantidad)),
        precioUnitario: toWeiString(precioPorToken),
        txHash: listTxHash,
      })
      
      toast.success('Orden de venta publicada exitosamente', { id: 'list_tx' })
      
      // Close and clear form fields upon success
      onOpenChange(false)
      setIsConfirming(false)
      setSubtokenId('')
      setCantidad('')
      setPrecioPorToken('')
      setErrors({})
    } catch (error) {
      toast.dismiss('list_tx')
      if (error?.fieldErrors) {
        setErrors(error.fieldErrors)
      } else {
        setErrors({ general: error?.message || error?.shortMessage || 'Error al publicar la orden de venta' })
      }
    } finally {
      setIsTxPending(false)
    }
  }

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
                Confirmar Publicación
              </DialogTitle>
              <DialogDescription className="text-sm pt-2">
                Estás a punto de publicar una orden de venta por <strong className="text-slate-200">{cantidad}</strong> sub-tokens a un precio unitario de <strong className="text-emerald-400">{formatCurrency(precioPorToken)}</strong>. 
                <br /><br />
                Recibirás un estimado total de <strong className="text-white text-base">{formatCurrency(total)}</strong>.
                <br /><br />
                ¿Estás seguro de que deseas confirmar y publicar esta orden en el mercado?
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsConfirming(false)}
                disabled={isTxPending || createListing.isPending}
                className="cursor-pointer border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={isTxPending || createListing.isPending}
                className="bg-violet-600 hover:bg-violet-500 text-white min-w-[100px] cursor-pointer"
              >
                {isTxPending || createListing.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Publicando...
                  </>
                ) : (
                  'Confirmar'
                )}
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
                <Coins className="w-5 h-5 text-violet-500" />
                Publicar Orden de Venta
              </DialogTitle>
              <DialogDescription className="text-xs">
                Ingresa la cantidad de sub-tokens y el precio unitario deseado para publicarlos en el libro de órdenes del Marketplace.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInitialSubmit} noValidate className="space-y-4 mt-2">
              {/* Subtoken Selector */}
              <div className="space-y-2 flex flex-col">
                <Label htmlFor="subtoken" className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Token a Vender</Label>
                {walletLoading ? (
                  <Skeleton className="h-10 w-full rounded-md" />
                ) : portfolio.length === 0 ? (
                  <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 p-3 rounded-lg border border-amber-200 dark:border-amber-500/20">
                    No tienes sub-tokens en tu portafolio para poder realizar una venta.
                  </div>
                ) : (
                  <select
                    id="subtoken"
                    value={subtokenId}
                    onChange={(e) => {
                      setSubtokenId(e.target.value)
                      setErrors((prev) => ({ ...prev, subtoken: undefined }))
                    }}
                    className={`flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer ${errors.subtoken ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'}`}
                    required
                  >
                    <option value="" disabled>Selecciona un token...</option>
                    {portfolio.map((item) => {
                      const displayName = item.subtokenSimbolo 
                        ? `${item.proyectoNombre} - $ ${item.subtokenSimbolo}`
                        : (item.proyectoNombre === item.subtokenNombre 
                            ? item.proyectoNombre 
                            : `${item.proyectoNombre} - ${item.subtokenNombre}`);
                      return (
                        <option key={item.subtokenId} value={item.subtokenId}>
                          {displayName} ({item.cantidad})
                        </option>
                      )
                    })}
                  </select>
                )}
                {errors.subtoken && (
                  <span className="text-xs text-red-500 font-medium mt-1">{errors.subtoken}</span>
                )}
                {isInvalidState && !errors.subtoken && (
                  <span className="text-xs text-amber-500 font-medium mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Solo se pueden vender tokens de proyectos en Ejecución o Finalizados.
                  </span>
                )}
              </div>
              {/* Cantidad Input */}
              <div className="space-y-2 flex flex-col">
                <Label htmlFor="cantidad" className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Cantidad a Vender</Label>
                <Input
                  id="cantidad"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Ej: 100"
                  value={cantidad}
                  onChange={(e) => {
                    setCantidad(e.target.value)
                    setErrors((prev) => ({ ...prev, cantidad: undefined }))
                  }}
                  className={`bg-white text-black transition-colors ${errors.cantidad ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'}`}
                  required
                />
                {errors.cantidad && (
                  <span className="text-xs text-red-500 font-medium mt-1">{errors.cantidad}</span>
                )}
              </div>
              {/* Precio Unitario Input */}
              <div className="space-y-2 flex flex-col">
                <Label htmlFor="precio" className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Precio por Token ($IDEA)</Label>
                <Input
                  id="precio"
                  type="text"
                  placeholder="Ej: 2.50"
                  value={precioPorToken}
                  onChange={(e) => {
                    setPrecioPorToken(e.target.value)
                    setErrors((prev) => ({ ...prev, precio: undefined }))
                  }}
                  className={`bg-white text-black transition-colors ${errors.precio ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'}`}
                  required
                />
                {errors.precio && (
                  <span className="text-xs text-red-500 font-medium mt-1">{errors.precio}</span>
                )}
              </div>
              {/* Total Cost Preview */}
              <div className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-lg flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Recibirás estimado:</span>
                <span className="text-slate-900 dark:text-white font-bold text-base">{formatCurrency(total)}</span>
              </div>
              {/* Buttons */}
              <div className="flex gap-3 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false)
                    setErrors({})
                    setIsConfirming(false)
                  }}
                  className="cursor-pointer border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createListing.isPending || portfolio.length === 0 || isInvalidState}
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