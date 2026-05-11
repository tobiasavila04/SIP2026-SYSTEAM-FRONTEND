import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useProject, useUpdateProjectStatus } from '@/hooks/use-projects'
import { useAuthStore } from '@/stores/auth-store'
import { usePermissions } from '@/stores/auth-store'
import { apiRequest } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'
import { ErrorState } from '@/components/shared/error-state'
import { StatusBadge } from '@/components/shared/status-badge'
import { Skeleton } from '@/components/shared/loading-skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { statusVariants, statusLabels, FundingProgress } from '@/lib/project-constants'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { ArrowLeft, Target, Calendar, Coins, Wallet, Loader2, TrendingUp, Rocket, CheckCircle2, Ban, SquarePen } from 'lucide-react'

function InvestDialog({ open, onOpenChange, projectId, projectTitle, onSuccess }) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const handleInvest = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error('Ingresá un monto válido')
      return
    }
    setLoading(true)
    try {
      await apiRequest(API_ENDPOINTS.PROJECT_INVEST(projectId), {
        method: 'POST',
        params: { amount: Number(amount) },
      })
      toast.success('Inversión realizada con éxito')
      setAmount('')
      onOpenChange(false)
      onSuccess?.()
    } catch (e) {
      toast.error(e?.message || 'Error al procesar la inversión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-violet-400" />
            Invertir en {projectTitle}
          </DialogTitle>
          <DialogDescription>Ingresá el monto que deseas invertir en este proyecto.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Monto a invertir</Label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <Input type="number" min="1" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="pl-7" />
            </div>
          </div>
          <Button onClick={handleInvest} disabled={!amount || loading} className="w-full bg-violet-600 hover:bg-violet-500 text-white gap-2 h-10 rounded-lg">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Procesando...' : 'Confirmar inversión'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function StatusActions({ project, isCreator, canInvest, onInvest, onTransition, transitioning }) {
  if (!isCreator && !canInvest) return null

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {canInvest && (
        <Button onClick={onInvest} className="bg-violet-600 hover:bg-violet-500 text-white gap-2 h-9 px-5 text-sm rounded-lg shadow-lg shadow-violet-600/20">
          <TrendingUp className="w-4 h-4" />
          Invertir
        </Button>
      )}
      {isCreator && project.estado === 'PREPARACION' && (
        <Button onClick={() => onTransition('FINANCIAMIENTO')} disabled={transitioning} className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 h-9 px-5 text-sm rounded-lg shadow-lg shadow-emerald-600/20">
          {transitioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
          {transitioning ? 'Publicando...' : 'Publicar'}
        </Button>
      )}
      {isCreator && project.estado === 'FINANCIAMIENTO' && (
        <Button onClick={() => onTransition('EJECUCION')} disabled={transitioning} className="bg-amber-600 hover:bg-amber-500 text-white gap-2 h-9 px-5 text-sm rounded-lg">
          {transitioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
          {transitioning ? 'Iniciando...' : 'Iniciar ejecución'}
        </Button>
      )}
      {isCreator && project.estado === 'EJECUCION' && (
        <Button onClick={() => onTransition('FINALIZADO')} disabled={transitioning} className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 h-9 px-5 text-sm rounded-lg">
          {transitioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {transitioning ? 'Finalizando...' : 'Finalizar'}
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
    </div>
  )
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const projectId = Number(id)
  const user = useAuthStore((s) => s.user)
  const { isInvestor } = usePermissions()

  const { data: project, isLoading, isError, refetch } = useProject(projectId)
  const updateStatus = useUpdateProjectStatus()

  const [showInvestDialog, setShowInvestDialog] = useState(false)
  const [transitioning, setTransitioning] = useState(false)

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

  if (isError || !project) {
    return <ErrorState message="No se pudo cargar el proyecto." onRetry={() => refetch()} />
  }

  const isCreator = project.creadorId === user?.id
  const canInvest = isInvestor && project.estado === 'FINANCIAMIENTO'

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
            <h1 className="text-2xl font-bold text-white">{project.titulo}</h1>
            <StatusBadge variant={statusVariants[project.estado] || 'default'}>
              {statusLabels[project.estado] || project.estado}
            </StatusBadge>
          </div>
          <StatusActions
            project={project}
            isCreator={isCreator}
            canInvest={canInvest}
            onInvest={() => setShowInvestDialog(true)}
            onTransition={transitionTo}
            transitioning={transitioning}
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
          <div className="pt-2">
            <FundingProgress raised={project.montoRecaudado} required={project.montoRequerido} />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-white/5">
          <MetricCard icon={Target} label="Monto requerido" value={formatCurrency(project.montoRequerido)} valueClass="text-emerald-300" />
          <MetricCard
            icon={Calendar}
            label={project.estado === 'FINANCIAMIENTO' ? 'Fin financiamiento' : 'Plazo'}
            value={project.financingEndDate ? formatDate(project.financingEndDate) : 'No definido'}
          />
          <MetricCard icon={Coins} label="Cupo máximo tokens" value={project.cupoMaximoTokens?.toLocaleString() ?? 'No definido'} />
          <MetricCard icon={Wallet} label="Valor nominal token" value={project.valorNominalToken ? formatCurrency(project.valorNominalToken) : 'No definido'} />
        </div>

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

      <InvestDialog
        open={showInvestDialog}
        onOpenChange={setShowInvestDialog}
        projectId={projectId}
        projectTitle={project.titulo}
        onSuccess={refetch}
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
