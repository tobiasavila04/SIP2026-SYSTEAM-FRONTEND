import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAccount, useWriteContract, useConfig } from 'wagmi'
import { waitForTransactionReceipt } from '@wagmi/core'
import { parseUnits } from 'viem'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useProject, useUpdateProjectStatus, useBoostProject, useEvaluateStates, useCloseProject, useSubmitAuditFinding } from '@/hooks/use-projects'
import { useTokenInfo } from '@/hooks/use-investment'
import { useAuthStore, usePermissions } from '@/stores/auth-store'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { statusVariants, statusLabels, FundingProgress } from '@/lib/project-constants'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ERC20_ABI } from '@/lib/abis'
import { toast } from 'sonner'
import { differenceInDays } from 'date-fns'
import { ArrowLeft, Target, Calendar, Coins, Wallet, Loader2, TrendingUp, Rocket, CheckCircle2, Ban, SquarePen, ExternalLink, RefreshCw, AlertTriangle, Star, Sparkles, ShieldCheck, FileText } from 'lucide-react'

const VITE_INVESTMENT_SWAP_ADDRESS = import.meta.env.VITE_INVESTMENT_SWAP_ADDRESS



function GasErrorModal({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Falta de Gas (ETH)
          </DialogTitle>
          <DialogDescription>
            No tenés suficientes fondos en la red Base Sepolia para cubrir el costo de red (Gas) de esta transacción.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-200">
            Para registrar tu proyecto en la Blockchain, necesitás tener un poco de ETH (Base Sepolia) en tu billetera para pagar a los validadores. 
            <br/><br/>
            Podés conseguir ETH de prueba gratis en cualquier Faucet de Base Sepolia.
          </div>
          <Button onClick={() => onOpenChange(false)} variant="secondary" className="w-full h-10 rounded-lg bg-white/10 hover:bg-white/20 text-white border-0">
            Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AuditDialog({ open, onOpenChange, onConfirm, resultado, transitioning }) {
  const [kybUrl, setKybUrl] = useState('')
  const [observaciones, setObservaciones] = useState('')

  useEffect(() => {
    if (open) {
      setKybUrl('')
      setObservaciones('')
    }
  }, [open])

  const handleSubmit = (e) => {
    e.preventDefault()
    onConfirm(resultado, kybUrl, observaciones)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {resultado === 'APROBADO' ? (
              <><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Aprobar Auditoría</>
            ) : (
              <><Ban className="w-5 h-5 text-red-500" /> Rechazar Auditoría</>
            )}
          </DialogTitle>
          <DialogDescription>
            Completá los datos del reporte de auditoría (KYB) para registrar la decisión en el sistema.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="kybUrl" className="text-slate-300">URL del reporte KYB *</Label>
            <Input
              id="kybUrl"
              value={kybUrl}
              onChange={(e) => setKybUrl(e.target.value)}
              placeholder="https://proveedor-kyb.com/reporte/..."
              required
              disabled={transitioning}
              className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-emerald-500/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="observaciones" className="text-slate-300">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder={resultado === 'APROBADO' ? 'Todo en orden. Cumple los requisitos.' : 'Motivo del rechazo...'}
              disabled={transitioning}
              className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 min-h-[100px] focus-visible:ring-emerald-500/50"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={transitioning} className="border-white/10">
              Cancelar
            </Button>
            <Button type="submit" disabled={transitioning || !kybUrl} className={resultado === 'APROBADO' ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-red-600 hover:bg-red-500 text-white"}>
              {transitioning ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function PublishSuccessModal({ open, onOpenChange, tokenAddress }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Proyecto Registrado Exitosamente
          </DialogTitle>
          <DialogDescription>
            Tu proyecto ha sido desplegado en la blockchain (Base Sepolia) y ya está abierto a inversores.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="p-4 rounded-lg bg-slate-950 border border-emerald-500/20 text-sm">
            <p className="text-slate-400 mb-2">Contrato Inteligente (Token):</p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <span className="font-mono text-emerald-400 text-xs sm:text-sm break-all">{tokenAddress || 'Sincronizando...'}</span>
              {tokenAddress && tokenAddress.startsWith('0x') && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.open(`https://sepolia.basescan.org/token/${tokenAddress}`, '_blank')}
                  className="shrink-0 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  BaseScan
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)} className="bg-slate-800 text-slate-100 hover:bg-slate-700 hover:text-white border-0">Cerrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function StatusActions({ project, isCreator, isAdmin, isAuditor, canInvest, onInvest, onRefund, onBoost, onDesboost, onTransition, onAudit, onPublish, onClose, onEvaluateStates, onReportBilling, transitioning, closing }) {
  const failed = project.estado === 'CANCELADO' || project.estado === 'RECHAZADO' || (project.estado === 'FINALIZADO' && project.montoRecaudado < project.montoRequerido)

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* 1. Acciones principales de transición de estado e inversión */}
      {canInvest && (
        <Button onClick={onInvest} className="bg-violet-600 hover:bg-violet-500 text-white gap-2 h-9 px-4 text-sm rounded-lg shadow-lg shadow-violet-600/20">
          <TrendingUp className="w-4 h-4" />
          Invertir
        </Button>
      )}

      {(isAuditor || isAdmin) && project.estado === 'EN_AUDITORIA' && (
        <>
          <Button onClick={() => onAudit('APROBADO')} disabled={transitioning} className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 h-9 px-4 text-sm rounded-lg shadow-lg shadow-emerald-600/20">
            {transitioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Aprobar Auditoría
          </Button>
          <Button onClick={() => onAudit('RECHAZADO')} disabled={transitioning} className="bg-red-600 hover:bg-red-500 text-white gap-2 h-9 px-4 text-sm rounded-lg shadow-lg shadow-red-600/20">
            {transitioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
            Rechazar Auditoría
          </Button>
        </>
      )}

      {isCreator && project.estado === 'PREPARACION' && (
        <Button onClick={() => onTransition('EN_AUDITORIA')} disabled={transitioning} className="bg-blue-600 hover:bg-blue-500 text-white gap-2 h-9 px-4 text-sm rounded-lg shadow-lg shadow-blue-600/20">
          {transitioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
          {transitioning ? 'Enviando...' : 'Enviar a Auditoría'}
        </Button>
      )}

      {isCreator && project.estado === 'EN_AUDITORIA' && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 text-slate-400 rounded-lg border border-slate-700/50 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Pendiente de revisión
        </div>
      )}

      {isCreator && project.estado === 'AUDITADO' && (
        <Button onClick={onPublish} disabled={transitioning} className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 h-9 px-4 text-sm rounded-lg shadow-lg shadow-emerald-600/20">
          {transitioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
          {transitioning ? 'Publicando...' : 'Publicar'}
        </Button>
      )}

      {isCreator && project.estado === 'EJECUCION' && (
        <Button onClick={onClose} disabled={closing} className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 h-9 px-4 text-sm rounded-lg">
          {closing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {closing ? 'Cerrando...' : 'Cerrar proyecto'}
        </Button>
      )}

      {/* 2. Acciones secundarias y gestión */}
      {isCreator && project.estado === 'EJECUCION' && (
        <Button onClick={onReportBilling} variant="outline" className="gap-2 border-blue-500/20 text-blue-400 hover:bg-blue-500/10 h-9 px-4 text-sm rounded-lg">
          <FileText className="w-4 h-4" />
          Reportar facturación
        </Button>
      )}

      {project.estado !== 'FINALIZADO' && project.estado !== 'RECHAZADO' && project.estado !== 'CANCELADO' && (
        <Button onClick={onBoost} disabled={transitioning} variant="outline" className="gap-2 border-amber-500/20 text-amber-400 hover:bg-amber-500/10 h-9 px-4 text-sm rounded-lg shadow-sm shadow-amber-500/10">
          <Star className="w-4 h-4 fill-amber-500/50" />
          Sumar Boost (100 $IDEA)
        </Button>
      )}

      {isCreator && ['PREPARACION', 'EN_AUDITORIA', 'AUDITADO', 'FINANCIAMIENTO'].includes(project.estado) && (
        <Link to={`/proyectos/${project.id}/editar`}>
          <Button variant="outline" className="gap-2 border-white/10 h-9 px-4 text-sm rounded-lg">
            <SquarePen className="w-4 h-4" />
            Editar
          </Button>
        </Link>
      )}

      {isCreator && ['PREPARACION', 'EN_AUDITORIA', 'AUDITADO'].includes(project.estado) && (
        <Button onClick={() => onTransition('CANCELADO')} disabled={transitioning} variant="outline" className="gap-2 border-red-500/20 text-red-400 hover:bg-red-500/10 h-9 px-4 text-sm rounded-lg">
          {transitioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
          Cancelar
        </Button>
      )}

      {/* Admin actions */}
      {isAdmin && (
        <>
          <div className="w-px h-6 bg-white/10 mx-1" />
          <Button onClick={onEvaluateStates} variant="outline" className="gap-2 border-white/10 text-slate-400 h-9 px-4 text-sm rounded-lg">
            <RefreshCw className="w-4 h-4" />
            Evaluar vencimientos
          </Button>

          {project.estado === 'FINANCIAMIENTO' && (
            <Button onClick={() => onTransition('CANCELADO')} disabled={transitioning} variant="outline" className="gap-2 border-red-500/20 text-red-400 hover:bg-red-500/10 h-9 px-4 text-sm rounded-lg">
              {transitioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
              Forzar Cancelación
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
  const usuarioId = useAuthStore((s) => s.user?.id)
  const { can, isAdmin, isAuditor } = usePermissions()

  const { data: project, isLoading, isError, refetch } = useProject(projectId)
  const isCreator = project?.creadorId === usuarioId
  const updateStatus = useUpdateProjectStatus()
  const boostProject = useBoostProject()
  const evaluateStates = useEvaluateStates()
  const closeProject = useCloseProject()
  const submitAuditFinding = useSubmitAuditFinding()

  const { address, isConnected } = useAccount()
  const config = useConfig()
  const { writeContractAsync } = useWriteContract({
    mutation: {
      meta: { suppressErrorToast: true }
    }
  })

  const ideaTokenAddress = import.meta.env.VITE_IDEA_TOKEN_ADDRESS

  const [showDisclaimerDialog, setShowDisclaimerDialog] = useState(false)
  const [auditDialogState, setAuditDialogState] = useState({ open: false, resultado: 'APROBADO' })
  const [publishSuccessToken, setPublishSuccessToken] = useState(null)
  const [showInvestDialog, setShowInvestDialog] = useState(false)

  const [showGasError, setShowGasError] = useState(false)
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
      let statusName = 'cancelado'
      if (status === 'FINANCIAMIENTO') statusName = 'publicado'
      if (status === 'EJECUCION') statusName = 'en ejecución'
      if (status === 'FINALIZADO') statusName = 'finalizado'
      if (status === 'EN_AUDITORIA') statusName = 'enviado a auditoría'
      
      toast.success(`Proyecto ${statusName} exitosamente`)
      refetch()
    } catch (e) {
      toast.error(e?.message || 'Error al cambiar estado')
    } finally {
      setTransitioning(false)
    }
  }

  const publishProject = async () => {
    if (!isConnected || !address) {
      toast.error('Conectá tu wallet primero para registrar el proyecto')
      return
    }

    setTransitioning(true)
    try {
      toast.info('Publicando proyecto...')
      await updateStatus.mutateAsync({ id: projectId, status: 'FINANCIAMIENTO' })
      
      // Fetch token info right away to get the contract address for the modal
      try {
        const tokenRes = await apiRequest(API_ENDPOINTS.TOKEN_BY_PROJECT(projectId))
        setTokenInfo(tokenRes)
        setPublishSuccessToken(tokenRes.contractAddress)
      } catch (e) {
        console.error("No se pudo obtener el token inmediatamente", e)
        setPublishSuccessToken("Pendiente de sincronización")
      }

      refetch()
    } catch (e) {
      console.error(e)
      const errorMsg = e?.message?.toLowerCase() || ''
      if (errorMsg.includes('insufficient funds') || errorMsg.includes('gas')) {
        setShowGasError(true)
      } else {
        toast.error(e?.shortMessage || e?.message || 'Error al publicar el proyecto en blockchain')
      }
    } finally {
      setTransitioning(false)
    }
  }

  const [loadingTokenFetch, setLoadingTokenFetch] = useState(false)

  const fetchTokenInfo = async () => {
    setLoadingTokenFetch(true)
    try {
      const res = await apiRequest(API_ENDPOINTS.TOKEN_BY_PROJECT(projectId))
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

  const handleAuditSubmit = async (resultado, kybUrl, observaciones) => {
    if (!project) return
    setTransitioning(true)
    try {
      await submitAuditFinding.mutateAsync({ id: project.id, resultado, observaciones, kybUrl })
      setAuditDialogState({ ...auditDialogState, open: false })
      refetch()
    } catch (e) {
      toast.error(e?.message || 'Error al enviar auditoría')
    } finally {
      setTransitioning(false)
    }
  }

  const handleBoost = async () => {
    if (!isConnected || !address) {
      toast.error('Conectá tu wallet primero para sumar un boost', { id: 'boost' })
      return
    }

    if (!ideaTokenAddress) {
      toast.error('Cargando información del token, intenta en un segundo...')
      return
    }
    
    try {
      const BURN_ADDRESS = '0x000000000000000000000000000000000000dEaD'
      const amountWei = parseUnits('100', 18)
      
      toast.loading('Autoriza la quema de 100 $IDEA en MetaMask...', { id: 'boost' })
      
      const txHash = await writeContractAsync({
        address: ideaTokenAddress,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [BURN_ADDRESS, amountWei],
      })

      toast.loading('Esperando confirmación en la red Sepolia...', { id: 'boost' })
      const receipt = await waitForTransactionReceipt(config, { hash: txHash })
      
      if (receipt.status === 'success') {
        toast.loading('Impactando en el ranking...', { id: 'boost' })
        await boostProject.mutateAsync({ id: projectId, txHash })
        refetch()
        toast.success('¡Boost aplicado! El proyecto subió en el ranking', { id: 'boost' })
      } else {
        toast.error('La transacción falló en la red', { id: 'boost' })
      }
    } catch (err) {
      toast.error('Error al autorizar o enviar la transacción', { id: 'boost' })
    }
  }

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

  const canInvest = can('investment:create') && project.estado === 'FINANCIAMIENTO'
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
              {project.montoBoost > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/25 shadow-sm shadow-amber-500/10">
                  <Star className="w-3 h-3 fill-amber-400" />
                  🔥 {Number(project.montoBoost).toLocaleString()} $IDEA
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
            isAuditor={isAuditor}
            canInvest={canInvest}
            onInvest={() => setShowDisclaimerDialog(true)}
            onBoost={handleBoost}
            onTransition={transitionTo}
            onAudit={(resultado) => setAuditDialogState({ open: true, resultado })}
            onPublish={publishProject}
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
                <MetricCard icon={TrendingUp} label="Estado en blockchain" value={tokenInfo?.contractAddress ? 'Creado' : 'Pendiente'} valueClass={tokenInfo?.contractAddress ? 'text-emerald-300' : 'text-amber-300'} />
              </div>
            )}
            {tokenInfo?.contractAddress && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
                <span>Token contract:</span>
                <a
                  href={`https://sepolia.basescan.org/token/${tokenInfo.contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-400 hover:text-violet-300 transition-colors font-mono"
                >
                  {tokenInfo.contractAddress.slice(0, 8)}...{tokenInfo.contractAddress.slice(-6)}
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



      <OracleBillingForm
        projectId={projectId}
        open={showOracleBillingForm}
        onOpenChange={setShowOracleBillingForm}
      />

      <AuditDialog
        open={auditDialogState.open}
        onOpenChange={(open) => setAuditDialogState(prev => ({ ...prev, open }))}
        onConfirm={handleAuditSubmit}
        resultado={auditDialogState.resultado}
        transitioning={transitioning}
      />

      <PublishSuccessModal
        open={!!publishSuccessToken}
        onOpenChange={(open) => !open && setPublishSuccessToken(null)}
        tokenAddress={publishSuccessToken}
      />

      <GasErrorModal
        open={showGasError}
        onOpenChange={setShowGasError}
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
