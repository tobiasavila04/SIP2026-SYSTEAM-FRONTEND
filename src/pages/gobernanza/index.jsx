import { useState, useCallback, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest, getStoredToken } from '@/lib/api-client'
import { API_ENDPOINTS } from '@/config/api'
import { PageHeader } from '@/components/shared/page-header'
import { ErrorState } from '@/components/shared/error-state'
import { CardSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Vote, Loader2, Sparkles, ThumbsUp, ThumbsDown, Clock, Zap
} from 'lucide-react'

/* -------------------------------------------------------------------------- */
/*  ConfirmVoteDialog                                                          */
/* -------------------------------------------------------------------------- */
function ConfirmVoteDialog({ open, onOpenChange, project, support, onConfirm, loading, voteCost, voteReward }) {
  const label = support === true ? 'a favor' : 'en contra'
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {support === true ? (
              <ThumbsUp className="w-5 h-5 text-emerald-500" />
            ) : (
              <ThumbsDown className="w-5 h-5 text-red-500" />
            )}
            Votar {label}
          </DialogTitle>
          <DialogDescription>
            Vas a emitir tu voto <strong>{label}</strong> de:
            <br />
            <strong className="text-white">{project?.titulo}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 space-y-1">
            <p>
              <strong>Costo:</strong> {voteCost} $IDEA
            </p>
            <p>
              <strong>Recompensa:</strong> {voteReward} $IDEA
            </p>
            <p className="text-amber-400/70 text-[10px] pt-1">
              El voto se registra on-chain y se descuenta de tu billetera en la plataforma.
            </p>
          </div>

          {project && (
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Votos a favor</span>
              <span className="font-semibold text-emerald-400">{Number(project.forVotes ?? 0).toLocaleString()}</span>
            </div>
          )}
          {project && (
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Votos en contra</span>
              <span className="font-semibold text-red-400">{Number(project.againstVotes ?? 0).toLocaleString()}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'gap-2',
              support === true
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-red-600 hover:bg-red-500 text-white',
            )}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {support === true ? <ThumbsUp className="w-4 h-4" /> : <ThumbsDown className="w-4 h-4" />}
                Confirmar voto {label}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* -------------------------------------------------------------------------- */
/*  ProjectCard                                                                */
/* -------------------------------------------------------------------------- */
function ProjectCard({ project, onVote, votingId }) {
  const isVoting = votingId === project.id
  const totalVotes = Number(project.totalVotes ?? 0)

  const forPct = totalVotes > 0 ? Math.round((Number(project.forVotes) / totalVotes) * 100) : 0
  const againstPct = totalVotes > 0 ? Math.round((Number(project.againstVotes) / totalVotes) * 100) : 0

  return (
    <div className="group relative rounded-xl border border-white/5 bg-card hover:border-amber-500/20 transition-all duration-300 ease-out flex flex-col h-full overflow-hidden">
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="p-5 pb-0 flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
          <Vote className="w-5 h-5 text-amber-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-white group-hover:text-amber-300 transition-colors truncate">
            {project.titulo}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
            {project.descripcion}
          </p>
        </div>
      </div>

      <div className="px-5 pt-4">
        <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden flex">
          <div
            className="h-full bg-emerald-500/70 transition-all duration-500"
            style={{ width: `${forPct}%` }}
          />
          <div
            className="h-full bg-red-500/70 transition-all duration-500"
            style={{ width: `${againstPct}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
          <span>{forPct}% a favor</span>
          <span>{againstPct}% en contra</span>
        </div>
      </div>

      <div className="px-5 pt-3 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-emerald-400 font-medium">{Number(project.forVotes ?? 0).toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ThumbsDown className="w-3.5 h-3.5 text-red-500" />
          <span className="text-red-400 font-medium">{Number(project.againstVotes ?? 0).toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <Clock className="w-3 h-3 text-slate-500" />
          <span className="text-slate-500">{totalVotes.toLocaleString()} total</span>
        </div>
      </div>

      <div className="mt-auto px-5 py-4 flex gap-2">
        <Button
          onClick={() => onVote(project, true)}
          disabled={isVoting}
          className="flex-1 gap-1.5 h-9 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40"
        >
          {isVoting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
          A favor
        </Button>
        <Button
          onClick={() => onVote(project, false)}
          disabled={isVoting}
          variant="outline"
          className="flex-1 gap-1.5 h-9 text-sm rounded-lg border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40"
        >
          {isVoting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsDown className="w-4 h-4" />}
          En contra
        </Button>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  VotingPage                                                                */
/* -------------------------------------------------------------------------- */
export default function VotingPage() {
  const queryClient = useQueryClient()
  const [voteDialog, setVoteDialog] = useState({ open: false, project: null, support: null })
  const [votingId, setVotingId] = useState(null)

  /* ── Config (cost / reward) ───────────────────────────────────────── */
  const { data: govConfig } = useQuery({
    queryKey: ['governance-config'],
    queryFn: () => apiRequest(API_ENDPOINTS.GOVERNANCE_CONFIG),
    staleTime: 5 * 60 * 1000,
  })
  const voteCost = Number(govConfig?.voteCost ?? 10)
  const voteReward = Number(govConfig?.voteReward ?? 5)

  /* ── Projects in EJECUCION ─────────────────────────────────────────── */
  const {
    data: projectsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['projects-voting', 'EJECUCION'],
    queryFn: () =>
      apiRequest(`${API_ENDPOINTS.PROJECTS_CATALOG}?estado=EJECUCION`),
    refetchInterval: 15_000,
  })
  const projects = Array.isArray(projectsData) ? projectsData : projectsData?.content ?? []

  /* ── Vote counts update via refetchInterval (every 15s) ─────────── */
  /* SSE connections removed: opening one per project exhausts the
     browser's 6-connection-per-domain limit and blocks vote requests. */
  const mergedProjects = projects

  /* ── Vote flow ─────────────────────────────────────────────────────── */
  const handleVoteClick = useCallback((project, support) => {
    setVoteDialog({ open: true, project, support })
  }, [])

  const confirmVote = useCallback(async () => {
    const { project, support } = voteDialog
    if (!project) return

    setVotingId(project.id)
    setVoteDialog({ open: false, project: null, support: null })

    try {
      toast.loading('Emitiendo voto...', { id: 'vote' })

      const token = getStoredToken()
      const response = await fetch(API_ENDPOINTS.PROJECT_VOTE(project.id), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ support }),
      })

      if (response.status === 403) {
        throw new Error('No tenés permiso para votar (governance:vote)')
      }

      if (response.status === 409) {
        const errorBody = await response.text().catch(() => '')
        let errorMsg
        try {
          errorMsg = JSON.parse(errorBody).error || JSON.parse(errorBody).message || errorBody
        } catch {
          errorMsg = errorBody || 'Conflicto al votar'
        }
        throw new Error(errorMsg)
      }

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '')
        let errorMsg
        try {
          errorMsg = JSON.parse(errorBody).error || errorBody
        } catch {
          errorMsg = errorBody || `Error ${response.status}`
        }
        throw new Error(errorMsg)
      }

      const txHash = await response.text()
      console.debug('Vote txHash:', txHash)

      queryClient.invalidateQueries({ queryKey: ['projects-voting'] })

      toast.success(
        support
          ? 'Votaste a favor del proyecto. ¡Gracias por participar!'
          : 'Votaste en contra del proyecto.',
        { id: 'vote' },
      )
    } catch (err) {
      toast.dismiss('vote')
      const msg = err?.message?.toLowerCase() || ''
      if (msg.includes('saldo insuficiente') || msg.includes('insufficient')) {
        toast.error('No tenés saldo suficiente de $IDEA para votar')
      } else if (msg.includes('ya votó') || msg.includes('already voted')) {
        toast.error('Ya votaste en este proyecto')
      } else if (msg.includes('ejecucion') || msg.includes('execution')) {
        toast.error('Este proyecto no está en estado de ejecución')
      } else {
        toast.error(err?.message || 'Error al emitir el voto')
      }
    } finally {
      setVotingId(null)
    }
  }, [voteDialog, queryClient])

  /* ── Render ────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      <PageHeader
        icon={Vote}
        title="Votación de Proyectos"
        description={`Votá por los proyectos en ejecución usando tus tokens $IDEA. Cada voto cuesta ${voteCost} $IDEA y recibís ${voteReward} $IDEA de recompensa.`}
      />

      <section className="rounded-xl border border-white/5 bg-card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Vote className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                Votar cuesta {voteCost} $IDEA
              </p>
              <p className="text-xs text-slate-500">
                Recibís {voteReward} $IDEA de recompensa por cada voto emitido
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Governance x2 Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-400/30 rounded-full animate-pulse-slow">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-cyan-400 tracking-wide">
                VOTO x2 ACTIVADO
              </span>
            </div>

            <Badge variant="outline" className="text-xs text-slate-400 border-slate-600">
              {projects.length} proyecto{projects.length !== 1 ? 's' : ''} en ejecución
            </Badge>
          </div>
        </div>
      </section>

      {isError ? (
        <ErrorState message="No se pudieron cargar los proyectos." onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : mergedProjects.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No hay proyectos en votación"
          description="Los proyectos en ejecución aparecerán acá cuando estén disponibles para votar."
          action={undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {mergedProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onVote={handleVoteClick}
              votingId={votingId}
            />
          ))}
        </div>
      )}

      <ConfirmVoteDialog
        open={voteDialog.open}
        onOpenChange={(open) => setVoteDialog((prev) => ({ ...prev, open }))}
        project={voteDialog.project}
        support={voteDialog.support}
        onConfirm={confirmVote}
        loading={votingId === voteDialog.project?.id}
        voteCost={voteCost}
        voteReward={voteReward}
      />
    </div>
  )
}
