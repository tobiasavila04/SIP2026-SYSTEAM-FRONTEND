import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAccount, useWriteContract } from 'wagmi'
import { waitForTransactionReceipt } from '@wagmi/core'
import { wagmiConfig } from '@/lib/web3'
import { INVESTMENT_SWAP_ABI } from '@/lib/abis'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useProject, useUpdateProjectStatus, useBoostProject, useDesboostProject, useEvaluateStates, useCloseProject } from '@/hooks/use-projects'
import { useAuthStore } from '@/stores/auth-store'
import { usePermissions } from '@/stores/auth-store'
import { apiRequest } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'
import { InvestmentModal } from '@/components/features/investment/investment-modal'
import { InvestmentDisclaimerModal } from '@/components/features/investment/investment-disclaimer-modal'
import { OracleAuditPanel } from '@/components/features/oracle/oracle-audit-panel'
import { OracleBillingForm } from '@/components/features/oracle/oracle-billing-form'
import { useOracleReport } from '@/hooks/use-oracle'
import { TxHashLink } from '@/components/shared/tx-hash-link'
import { ErrorState } from '@/components/shared/error-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { ProjectFailedBanner } from '@/components/shared/project-failed-banner'
import { Skeleton } from '@/components/shared/loading-skeleton'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { statusVariants, statusLabels, FundingProgress } from '@/lib/project-constants'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { differenceInDays } from 'date-fns'
import { ArrowLeft, Target, Calendar, Coins, Wallet, Loader2, TrendingUp, Rocket, CheckCircle2, Ban, SquarePen, ExternalLink, RefreshCw, AlertTriangle, Star, Sparkles, ShieldCheck, FileText } from 'lucide-react'

const VITE_INVESTMENT_SWAP_ADDRESS = import.meta.env.VITE_INVESTMENT_SWAP_ADDRESS

function RefundDialog({ open, onOpenChange, projectId, onSuccess }) {
  const [step, setStep] = useState('idle')
  const [refundHash, setRefundHash] = useState(null)

  const { address, isConnected } = useAccount()
  const { writeContractAsync } = useWriteContract()

  const handleRefund = async () => {
    if (!isConnected || !address) {
      toast.error('Conectá tu wallet primero')
      return
    }

    try {
      setStep('refunding')
      const hash = await writeContractAsync({
        address: VITE_INVESTMENT_SWAP_ADDRESS,
        abi: INVESTMENT_SWAP_ABI,
        functionName: 'refund',
        args: [BigInt(projectId)],
      })
      setRefundHash(hash)
      await waitForTransactionReceipt(wagmiConfig, { hash })

      toast.success('Reembolso procesado exitosamente en la blockchain')
      setStep('done')
      onSuccess?.()
    } catch (e) {
      toast.error(e?.message || 'Error al procesar el reembolso')
      setStep('idle')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && step !== 'refunding') { setStep('idle'); setRefundHash(null); onOpenChange(v) } else onOpenChange(v) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-amber-400" />
            Solicitar Reembolso
          </DialogTitle>
          <DialogDescription>
            {step === 'done'
              ? 'Tu reembolso se procesó correctamente.'
              : 'El proyecto no alcanzó su meta de financiamiento. Podés solicitar el reembolso de tu inversión.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {step === 'done' && refundHash ? (
            <>
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <p className="text-sm text-emerald-300 font-medium">Reembolso confirmado</p>
                <TxHashLink hash={refundHash} />
              </div>
              <Button onClick={() => { setStep('idle'); setRefundHash(null); onOpenChange(false) }} className="w-full bg-violet-600 hover:bg-violet-500 text-white h-10 rounded-lg">
                Cerrar
              </Button>
            </>
          ) : (
            <>
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Al solicitar el reembolso, los tokens invertidos serán devueltos a tu wallet. Esta acción ejecuta una transacción on-chain.</span>
              </div>
              {!isConnected ? (
                <ConnectButton />
              ) : (
                <Button
                  onClick={handleRefund}
                  disabled={step === 'refunding'}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white gap-2 h-10 rounded-lg"
                >
                  {step === 'refunding' && <Loader2 className="w-4 h-4 animate-spin" />}
                  {step === 'refunding' ? 'Procesando reembolso...' : 'Solicitar Reembolso'}
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function StatusActions({ project, isCreator, isAdmin, canInvest, onInvest, onRefund, onBoost, onDesboost, onTransition, onClose, onEvaluateStates, onReportBilling, transitioning, closing }) {
  const failed = project.estado === 'CANCELADO' || project.estado === 'RECHAZADO' || (project.estado === 'FINALIZADO' && project.montoRecaudado < project.montoRequerido)

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {canInvest && (
        <Button onClick={onInvest} className="bg-violet-600 hover:bg-violet-500 text-white gap-2 h-9 px-5 text-sm rounded-lg shadow-lg shadow-violet-600/20">
          <TrendingUp className="w-4 h-4" />
          Invertir
        </Button>
      )}
      {failed && (
        <Button onClick={onRefund} variant="outline" size="sm" className="gap-2 border-amber-500/20 text-amber-400 hover:bg-amber-500/10">
          <RefreshCw className="w-3.5 h-3.5" />
          Solicitar Reembolso
        </Button>
      )}

      {isCreator && !project.esDestacado && project.estado !== 'FINALIZADO' && project.estado !== 'RECHAZADO' && project.estado !== 'CANCELADO' && (
        <Button onClick={onBoost} variant="outline" size="sm" className="gap-2 border-amber-500/20 text-amber-400 hover:bg-amber-500/10">
          <Star className="w-3.5 h-3.5" />
          Destacar (100 $IDEA)
        </Button>
      )}
      {isCreator && project.esDestacado && (
        <Button onClick={onDesboost} variant="outline" size="sm" className="gap-2 border-amber-500/20 text-amber-400 hover:bg-amber-500/10">
          <Star className="w-3.5 h-3.5 fill-amber-400" />
          Quitar destacado
        </Button>
      )}

      {/* Creator state transitions */}
      {isCreator && project.estado === 'PREPARACION' && (
        <Button onClick={() => onTransition('FINANCIAMIENTO')} disabled={transitioning} className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 h-9 px-5 text-sm rounded-lg shadow-lg shadow-emerald-600/20">
          {transitioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
          {transitioning ? 'Publicando...' : 'Publicar'}
        </Button>
      )}
      {isCreator && project.estado === 'EJECUCION' && (
        <Button onClick={onReportBilling} variant="outline" size="sm" className="gap-2 border-blue-500/20 text-blue-400 hover:bg-blue-500/10">
          <FileText className="w-3.5 h-3.5" />
          Reportar facturación
        </Button>
      )}
      {isCreator && project.estado === 'EJECUCION' && (
        <Button onClick={onClose} disabled={closing} className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 h-9 px-5 text-sm rounded-lg">
          {closing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {closing ? 'Cerrando...' : 'Cerrar proyecto'}
        </Button>
      )}
      {isCreator && project.estado !== 'CANCELADO' && project.estado !== 'FINALIZADO' && (
        <Button onClick={() => onTransition('CANCELADO')} disabled={transitioning} variant="outline" size="sm" className="gap-2 border-red-500/20 text-red-400 hover:bg-red-500/10">
          {transitioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
          Cancelar
        </Button>
      )}
      {isCreator && (
        <Link to={`/proyectos/${project.id}/editar`}>
          <Button variant="outline" size="sm" className="gap-2 border-white/10">
            <SquarePen className="w-3.5 h-3.5" />
            Editar
          </Button>
        </Link>
      )}

      {/* Admin actions */}
      {isAdmin && (
        <>
          <div className="w-px h-6 bg-white/10 mx-1" />
          <Button onClick={onEvaluateStates} variant="outline" size="sm" className="gap-2 border-white/10 text-slate-400">
            <RefreshCw className="w-3.5 h-3.5" />
            Evaluar vencimientos
          </Button>
          {failed && (
            <Button onClick={onRefund} variant="outline" size="sm" className="gap-2 border-amber-500/20 text-amber-400 hover:bg-amber-500/10">
              <RefreshCw className="w-3.5 h-3.5" />
              Forzar reembolso
            </Button>
          )}
        </>
      )}
    </div>
  )
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const projectId = Number(id)
  const user = useAuthStore((s) => s.user)
  const { isInvestor, isAdmin } = usePermissions()

  const { data: project, isLoading, isError, refetch } = useProject(projectId)
  const updateStatus = useUpdateProjectStatus()
  const boostProject = useBoostProject()
  const desboostProject = useDesboostProject()
  const evaluateStates = useEvaluateStates()
  const closeProject = useCloseProject()

  const [showDisclaimerDialog, setShowDisclaimerDialog] = useState(false)
  const [showInvestDialog, setShowInvestDialog] = useState(false)
  const [showRefundDialog, setShowRefundDialog] = useState(false)
  const [showOracleBillingForm, setShowOracleBillingForm] = useState(false)
  const [transitioning, setTransitioning] = useState(false)

  const [tokenInfo, setTokenInfo] = useState(null)
  const [loadingToken, setLoadingToken] = useState(false)

  const showOraclePanel = project?.estado === 'EJECUCION' || project?.estado === 'FINALIZADO'
  const { data: oracleReport, isLoading: oracleLoading, isError: oracleError } = useOracleReport(
    showOraclePanel ? projectId : null
  )

  const transitionTo = async (status) => {
    setTransitioning(true)
    try {
      await updateStatus.mutateAsync({ id: projectId, status })
      toast.success(
        `Proyecto ${
          status === 'FINANCIAMIENTO' ? 'publicado' :
          status === 'EJECUCION' ? 'en ejecución' :
          status === 'FINALIZADO' ? 'finalizado' : 'cancelado'
        } exitosamente`
      )
      refetch()
    } catch (e) {
      toast.error(e?.message || 'Error al cambiar estado')
    } finally {
      setTransitioning(false)
    }
  }

  const [loadingTokenFetch, setLoadingTokenFetch] = useState(false)

  const fetchTokenInfo = async () => {
    setLoadingTokenFetch(true)
    try {
      const res = await apiRequest(API_ENDPOINTS.TOKENS_BY_PROJECT(projectId))
      setTokenInfo(res)
    } catch {
      setTokenInfo(null)
    } finally {
      setLoadingTokenFetch(false)
    }
  }

  useEffect(() => {
    if (project?.estado === 'FINANCIAMIENTO' || project?.estado === 'EJECUCION' || project?.estado === 'FINALIZADO') {
      fetchTokenInfo()
    }
  }, [project?.id, project?.estado])

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-8 w-48" />
        <div className="rounded-xl border border-white/5 bg-card p-6 space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-6 w-40" />
        </div>
      </div>
    )
  }

  console.log('DEBUG project:', project)
  console.log('DEBUG simbolo:', project?.simbolo)
  if (isError || !project) {
    return <ErrorState message="No se pudo cargar el proyecto." onRetry={() => refetch()} />
  }

  const isCreator = project.creadorId === user?.id
  const canInvest = isInvestor && project.estado === 'FINANCIAMIENTO'
  const daysRemaining = project.plazo ? differenceInDays(new Date(project.plazo), new Date()) : null

  return (
    <div className="max-w-4xl space-y-6">
      <Link
        to="/proyectos"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a proyectos
      </Link>

      <div className="rounded-xl border border-white/5 bg-card p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{project.titulo}</h1>
              {project.esDestacado && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/25">
                  <Star className="w-3 h-3 fill-amber-400" />
                  DESTACADO
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge variant={statusVariants[project.estado] || 'default'}>
                {statusLabels[project.estado] || project.estado}
              </StatusBadge>
              {daysRemaining !== null && daysRemaining > 0 && project.estado === 'FINANCIAMIENTO' && (
                <span className="text-xs text-slate-500">
                  {daysRemaining} {daysRemaining === 1 ? 'día restante' : 'días restantes'}
                </span>
              )}
            </div>
          </div>
          <StatusActions
            project={project}
            isCreator={isCreator}
            isAdmin={isAdmin}
            canInvest={canInvest}
            onInvest={() => setShowDisclaimerDialog(true)}
            onRefund={() => setShowRefundDialog(true)}
            onBoost={() => boostProject.mutateAsync(projectId).then(refetch)}
            onDesboost={() => desboostProject.mutateAsync(projectId).then(refetch)}
            onTransition={transitionTo}
            onClose={() => closeProject.mutateAsync(projectId).then(refetch)}
            onEvaluateStates={() => evaluateStates.mutateAsync().then(refetch)}
            onReportBilling={() => setShowOracleBillingForm(true)}
            transitioning={transitioning}
            closing={closeProject.isPending}
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Descripción</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{project.descripcion}</p>
          </div>

          {project.objetivo && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Objetivo</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{project.objetivo}</p>
            </div>
          )}
        </div>

        {project.montoRecaudado != null && (
          <section aria-label="Progreso de financiamiento" className="pt-2">
            <FundingProgress raised={project.montoRecaudado} required={project.montoRequerido} />
          </section>
        )}

        <ProjectFailedBanner project={project} />

        <section aria-label="Métricas del proyecto" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-white/5">
          <MetricCard icon={Target} label="Monto requerido" value={formatCurrency(project.montoRequerido)} valueClass="text-emerald-300" />
          <MetricCard
            icon={Calendar}
            label="Fin financiamiento"
            value={project.plazo ? formatDate(project.plazo) : 'No definido'}
          />
          <MetricCard icon={Coins} label="Cupo máximo tokens" value={project.cupoMaximoTokens?.toLocaleString() ?? 'No definido'} />
          <MetricCard icon={Wallet} label="Valor nominal token" value={project.valorNominalToken ? formatCurrency(project.valorNominalToken) : 'No definido'} />
        </section>

        {/* Subtoken info section */}
        {(project.estado === 'FINANCIAMIENTO' || project.estado === 'EJECUCION' || project.estado === 'FINALIZADO') && (
          <section className="pt-4 border-t border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                Información del subtoken
                <span className="font-mono text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded text-[11px]">{project.simbolo || tokenInfo?.simbolo || '—'}</span>
              </h3>
              <button onClick={fetchTokenInfo} disabled={loadingTokenFetch} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                {loadingTokenFetch ? 'Cargando...' : 'Actualizar'}
              </button>
            </div>
            {tokenInfo ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <MetricCard icon={Coins} label="Suministro total" value={Number(tokenInfo.suministroTotal ?? 0).toLocaleString()} valueClass="text-violet-300" />
                <MetricCard icon={Wallet} label="Cupo restante" value={Number(tokenInfo.cupoRestante ?? 0).toLocaleString()} valueClass="text-violet-300" />
                <MetricCard icon={TrendingUp} label="Precio actual" value={`$${Number(tokenInfo.precioActual ?? 0).toFixed(2)}`} valueClass="text-emerald-300" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <MetricCard icon={Coins} label="Cupo máximo" value={project.cupoMaximoTokens?.toLocaleString() ?? '—'} valueClass="text-violet-300" />
                <MetricCard icon={Wallet} label="Valor nominal" value={project.valorNominalToken ? formatCurrency(project.valorNominalToken) : '—'} valueClass="text-violet-300" />
                <MetricCard icon={TrendingUp} label="Estado en blockchain" value={project.tokenAddress ? 'Creado' : 'Pendiente'} valueClass={project.tokenAddress ? 'text-emerald-300' : 'text-amber-300'} />
              </div>
            )}
            {project.tokenAddress && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
                <span>Token contract:</span>
                <a
                  href={`https://sepolia.basescan.org/token/${project.tokenAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-400 hover:text-violet-300 transition-colors font-mono"
                >
                  {project.tokenAddress.slice(0, 8)}...{project.tokenAddress.slice(-6)}
                  <ExternalLink className="w-3 h-3 inline ml-1" />
                </a>
              </div>
            )}
          </section>
        )}

        {showOraclePanel && (
          <OracleAuditPanel
            projectId={projectId}
            report={oracleReport}
            isLoading={oracleLoading}
            isError={oracleError}
          />
        )}

        <div className="pt-4 border-t border-white/5">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Creado el {formatDate(project.createdAt)}</span>
            {project.updatedAt !== project.createdAt && (
              <>
                <span>·</span>
                <span>Actualizado el {formatDate(project.updatedAt)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <InvestmentDisclaimerModal 
        open={showDisclaimerDialog} 
        onOpenChange={setShowDisclaimerDialog} 
        onConfirm={() => {
          setShowDisclaimerDialog(false)
          setShowInvestDialog(true)
        }} 
      />

      <InvestmentModal
        open={showInvestDialog}
        onOpenChange={setShowInvestDialog}
        projectId={projectId}
        projectTitle={project.titulo}
        simbolo={project.simbolo}
        onSuccess={refetch}
      />

      <RefundDialog
        open={showRefundDialog}
        onOpenChange={setShowRefundDialog}
        projectId={projectId}
        onSuccess={refetch}
      />

      <OracleBillingForm
        projectId={projectId}
        open={showOracleBillingForm}
        onOpenChange={setShowOracleBillingForm}
      />
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, valueClass }) {
  return (
    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <p className={`text-sm font-semibold ${valueClass || 'text-slate-300'}`}>{value}</p>
    </div>
  )
}
