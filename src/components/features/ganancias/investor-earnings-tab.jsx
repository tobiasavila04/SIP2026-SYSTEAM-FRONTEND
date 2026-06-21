import { DollarSign, CheckCircle2, TrendingUp, Loader2 } from 'lucide-react'
import { useAccount, useWriteContract, useConfig } from 'wagmi'
import { waitForTransactionReceipt } from '@wagmi/core'
import { DIVIDEND_DISTRIBUTOR_ABI } from '@/lib/abis'
import { toast } from 'sonner'
import { useMisReclamos, useReclamarDividendos, useDividendosPendientes } from '@/hooks/use-dividendos'
import { useInvestmentHistory } from '@/hooks/use-investment-history'
import { EmptyState } from '@/components/shared/empty-state'
import { ErrorState } from '@/components/shared/error-state'
import { Skeleton, StatSkeleton } from '@/components/shared/loading-skeleton'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDateTime } from '@/lib/utils'

function SummaryCard({ icon: Icon, label, value }) {
  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  )
}

function ProjectClaimRow({ projectId, projectTitle }) {
  const { address } = useAccount()
  const config = useConfig()
  const { writeContractAsync } = useWriteContract()
  const mutation = useReclamarDividendos(projectId)
  const hasWallet = !!address
  
  const { data: pendientesData, isLoading: pendientesLoading } = useDividendosPendientes(projectId, address || '')
  const pendientes = pendientesData?.pendientes ?? 0

  const isPending = mutation.isPending
  const canClaim = hasWallet && pendientes > 0

  const handleClaim = async () => {
    try {
      // 1. Reclamo on-chain directo con MetaMask (gas fijo para evitar error de estimación)
      const txHash = await writeContractAsync({
        address: import.meta.env.VITE_DIVIDEND_DISTRIBUTOR_ADDRESS,
        abi: DIVIDEND_DISTRIBUTOR_ABI,
        functionName: 'claim',
        args: [BigInt(projectId)],
        gas: 200_000n
      })

      // 2. Esperar confirmación
      await waitForTransactionReceipt(config, { hash: txHash })

      // 3. Registrar en backend
      await mutation.mutateAsync({ wallet: address, txHash, amount: pendientes })
      toast.success(`Dividendos reclamados para "${projectTitle}"`)
    } catch (err) {
      console.error(err)
      const msg = err?.message || ''
      if (
        msg.includes('DD: no tokens') ||
        msg.includes('nothing to claim') ||
        msg.includes('reverted') ||
        msg.includes('gas limit')
      ) {
        toast.error('No hay dividendos pendientes para reclamar en este proyecto.')
      } else if (msg.includes('User rejected') || msg.includes('user rejected')) {
        toast.error('Transacción cancelada en MetaMask')
      } else {
        toast.error('Error al reclamar dividendos en la blockchain')
      }
    }
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
      <span className="text-sm text-slate-300">{projectTitle}</span>
      <div className="flex items-center gap-3">
        {hasWallet && (
          <span className="text-sm text-slate-400 min-w-[120px] text-right">
            {pendientesLoading ? '...' : pendientes > 0 ? `${pendientes.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $IDEA pendientes` : 'Sin pendientes'}
          </span>
        )}
        <Button
          size="sm"
          onClick={handleClaim}
          disabled={!canClaim || isPending}
          title={!hasWallet ? 'Conectá tu wallet para reclamar' : !canClaim ? 'No hay dividendos pendientes para este proyecto' : undefined}
          className="gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs h-7 px-3 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3 h-3" />
          )}
          Reclamar
        </Button>
      </div>
    </div>
  )
}

export function InvestorEarningsTab() {
  const { data: reclamos, isLoading: reclamosLoading, isError: reclamosError, refetch: refetchReclamos } = useMisReclamos()
  const { data: historyPage, isLoading: historyLoading, isError: historyError, refetch: refetchHistory } = useInvestmentHistory(0, 100)

  const isLoading = reclamosLoading || historyLoading
  const isError = reclamosError || historyError

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatSkeleton />
          <StatSkeleton />
        </div>
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  if (isError) {
    return (
      <ErrorState
        message={`No se pudieron cargar tus ganancias. Error: ${reclamosError?.message || ''} | ${historyError?.message || ''}`}
        onRetry={() => { refetchReclamos(); refetchHistory() }}
      />
    )
  }

  const reclamosList = Array.isArray(reclamos) ? reclamos : []

  // investment history can be paginated or a plain array depending on the endpoint
  const investments = Array.isArray(historyPage)
    ? historyPage
    : Array.isArray(historyPage?.content)
      ? historyPage.content
      : []

  if (investments.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No tenés inversiones todavía"
        description="Invertí en un proyecto para poder reclamar dividendos."
      />
    )
  }

  // Build unique projects map from investment history
  const projectsMap = {}
  investments.forEach((inv) => {
    if (inv.proyectoId && !projectsMap[inv.proyectoId]) {
      projectsMap[inv.proyectoId] = inv.proyectoTitulo ?? String(inv.proyectoId)
    }
  })
  const uniqueProjects = Object.entries(projectsMap) // [[id, title], ...]

  const totalCobrado = reclamosList.reduce((acc, r) => acc + (r.montoRecibido ?? 0), 0)
  const totalReclamos = reclamosList.length

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SummaryCard
          icon={DollarSign}
          label="Total cobrado"
          value={`${Number(totalCobrado).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $IDEA`}
        />
        <SummaryCard
          icon={CheckCircle2}
          label="Reclamos realizados"
          value={totalReclamos}
        />
      </div>

      {/* Reclamar dividendos section */}
      <div className="rounded-xl border border-white/5 bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white">Reclamar dividendos</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Reclamá los dividendos pendientes de tus proyectos invertidos
          </p>
        </div>
        <div className="divide-y divide-white/5">
          {uniqueProjects.map(([projectId, projectTitle]) => (
            <ProjectClaimRow key={projectId} projectId={projectId} projectTitle={projectTitle} />
          ))}
        </div>
      </div>

      {/* Claims history */}
      <div className="rounded-xl border border-white/5 bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white">Historial de reclamos</h3>
        </div>

        {reclamosList.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No reclamaste dividendos todavía"
            description="Cuando reclames dividendos, aparecerán aquí."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-medium">Proyecto</th>
                  <th className="px-4 py-3 font-medium">Subtokens</th>
                  <th className="px-4 py-3 font-medium">Monto recibido</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Comprobante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reclamosList.map((reclamo) => (
                  <tr key={reclamo.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-slate-300">
                      {projectsMap[reclamo.proyectoId] ?? reclamo.proyectoId ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono">
                      {reclamo.cantidadSubtokens ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-emerald-400 font-mono font-medium">
                      {reclamo.montoRecibido != null ? `${Number(reclamo.montoRecibido).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $IDEA` : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {reclamo.reclamadoEn ? formatDateTime(reclamo.reclamadoEn) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {reclamo.txHash ? (
                        <a
                          href={`https://sepolia.basescan.org/tx/${reclamo.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-violet-400 hover:text-violet-300 transition-colors"
                        >
                          {reclamo.txHash.slice(0, 10)}...{reclamo.txHash.slice(-8)} ↗
                        </a>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
