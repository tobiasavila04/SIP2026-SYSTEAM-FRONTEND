import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ShieldCheck, ArrowUpRight, Loader2, Info, CheckCircle2, Circle, Link as LinkIcon, FileCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useReadContract } from 'wagmi'
import { formatCurrency } from '@/lib/utils'
import { useReleaseHito } from '@/hooks/use-projects'

// ABI mínimo para leer el mapping 'escrows(uint256) => address' del OfferingContract
const OFFERING_ABI = [
  {
    "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "name": "escrows",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  }
]

export function EscrowPanel({ project, isCreator, isAuditor, refetch }) {
  const [comprobantes, setComprobantes] = useState({})
  
  // Obtener la dirección del OfferingContract de las variables de entorno
  const offeringContractAddress = import.meta.env.VITE_OFFERING_CONTRACT_ADDRESS

  // Leer la dirección del Escrow automáticamente de la blockchain
  const { data: fetchedEscrowAddress, isLoading: loadingEscrow } = useReadContract({
    address: offeringContractAddress,
    abi: OFFERING_ABI,
    functionName: 'escrows',
    args: [project.id],
    query: {
      enabled: !!offeringContractAddress && (project.estado === 'EJECUCION' || project.estado === 'FINALIZADO'),
    }
  })

  const [manualAddress, setManualAddress] = useState('')
  const escrowAddress = fetchedEscrowAddress && fetchedEscrowAddress !== '0x0000000000000000000000000000000000000000' 
    ? fetchedEscrowAddress 
    : manualAddress

  const isFetchingEscrow = loadingEscrow || (project.estado === 'EJECUCION' && (!fetchedEscrowAddress || fetchedEscrowAddress === '0x0000000000000000000000000000000000000000'))

  const releaseHitoMutation = useReleaseHito(project.id)

  if (project.estado !== 'EJECUCION' && project.estado !== 'FINALIZADO') {
    return null
  }

  const handleRelease = async (hitoId) => {
    const url = comprobantes[hitoId]
    if (!url || !url.startsWith('http')) {
      toast.error('Ingrese una URL válida para el comprobante')
      return
    }
    if (!escrowAddress.startsWith('0x')) {
      toast.error('Ingrese la dirección del contrato Escrow')
      return
    }

    try {
      await releaseHitoMutation.mutateAsync({
        comprobanteUrl: url,
        escrowAddress: escrowAddress
      }, {
        onSuccess: () => {
          if (refetch) refetch()
        }
      })
    } catch (error) {
      toast.error(error?.message || 'Error al liberar fondos')
    }
  }

  const hitos = project.hitos || []

  return (
    <div className="border border-indigo-500/20 bg-indigo-500/5 shadow-lg shadow-indigo-500/10 mb-6 rounded-xl">
      <div className="flex flex-col space-y-2 p-6 pb-4">
        <h3 className="flex items-center gap-2 text-indigo-400 font-semibold leading-none tracking-tight text-lg">
          <ShieldCheck className="w-5 h-5" />
          Fideicomiso & Hitos (Escrow)
        </h3>
        <p className="text-sm text-slate-300">
          {isCreator 
            ? "Tus fondos se liberan por etapas a medida que avanzás con los hitos. Solicitá a auditoria@systeam.com cuando completes uno."
            : "Los fondos están protegidos y se liberan por etapas según se cumplen los hitos del proyecto."}
        </p>
      </div>
      
      {isAuditor && (
        <div className="px-6 pb-4">
          <div className="flex items-center gap-3">
             <div className="relative w-full max-w-sm">
                <Input
                  placeholder={isFetchingEscrow ? "Esperando address de la blockchain..." : "0x... (Escrow Address)"}
                  value={escrowAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  className="bg-slate-950 border-slate-700 font-mono text-sm pr-10"
                  readOnly={!isFetchingEscrow && escrowAddress.startsWith('0x')}
                />
                {loadingEscrow && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                  </div>
                )}
              </div>
              <span className="text-xs text-slate-400">Dirección del contrato Escrow necesaria para liberar fondos.</span>
          </div>
        </div>
      )}

      <div className="p-6 pt-0">
        <div className="space-y-4">
          {hitos.map((hito, index) => {
            const isCompleted = hito.estado === 'COMPLETADO'
            const isReleasing = releaseHitoMutation.isPending && releaseHitoMutation.variables?.hitoId === hito.id
            const amountToRelease = ((project.montoRecaudado || 0) * (hito.porcentaje / 100))
            
            return (
              <div key={hito.id || index} className={`relative flex flex-col sm:flex-row gap-4 p-4 rounded-xl border ${isCompleted ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-900/50 border-slate-700/50'} transition-colors`}>
                <div className="flex items-start gap-4 flex-1">
                  <div className="mt-1">
                    {isCompleted ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Circle className="w-5 h-5 text-slate-500" />}
                  </div>
                  <div className="space-y-1">
                    <h4 className={`font-medium ${isCompleted ? 'text-emerald-300' : 'text-slate-200'}`}>
                      {hito.titulo}
                    </h4>
                    <p className="text-sm text-slate-400">
                      Libera el <strong className="text-slate-300">{hito.porcentaje}%</strong> de los fondos ({formatCurrency(amountToRelease)} IDEA)
                    </p>
                    {isCompleted && hito.comprobanteUrl && (
                      <a href={hito.comprobanteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 mt-2 hover:underline">
                        <FileCheck className="w-3.5 h-3.5" />
                        Ver Comprobante
                      </a>
                    )}
                  </div>
                </div>

                {isAuditor && !isCompleted && (
                  <div className="flex flex-col gap-2 min-w-[250px] border-t sm:border-t-0 sm:border-l border-slate-700/50 pt-4 sm:pt-0 sm:pl-4">
                    <div className="relative">
                      <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <Input 
                        placeholder="URL del Comprobante"
                        value={comprobantes[hito.id] || ''}
                        onChange={(e) => setComprobantes(prev => ({...prev, [hito.id]: e.target.value}))}
                        className="pl-8 h-8 text-xs bg-slate-950 border-slate-700"
                      />
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => handleRelease(hito.id)} 
                      disabled={isReleasing || !comprobantes[hito.id]} 
                      className="bg-indigo-600 hover:bg-indigo-500 text-white w-full h-8 text-xs"
                    >
                      {isReleasing ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <ArrowUpRight className="w-3 h-3 mr-1.5" />}
                      Liberar Fondos
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
          {hitos.length === 0 && (
             <div className="text-center p-6 bg-slate-900/50 border border-slate-700/50 rounded-xl text-slate-400 text-sm">
               Este proyecto no tiene hitos definidos.
             </div>
          )}
        </div>
      </div>
    </div>
  )
}
