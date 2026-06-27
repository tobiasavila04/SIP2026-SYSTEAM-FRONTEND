import { useRewardsSummary } from '@/hooks/use-rewards'
import { Skeleton } from '@/components/shared/loading-skeleton'
import { Link } from 'react-router-dom'
import { Trophy, Vote, Calendar, ArrowRight } from 'lucide-react'

const REWARD_TYPES = [
  { key: 'VOTE_REWARD', label: 'Votos', icon: Vote, color: 'text-amber-400' },
  { key: 'EVENT_ATTENDANCE', label: 'Eventos', icon: Calendar, color: 'text-cyan-400' },
]

export function RewardsSummaryWidget() {
  const { data, isLoading, isError } = useRewardsSummary()

  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/5 bg-card p-6 shadow-lg space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-16 rounded-lg" />
          <Skeleton className="h-16 rounded-lg" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-white/5 bg-card p-6 shadow-lg">
        <p className="text-sm text-red-400">No se pudieron cargar las recompensas.</p>
      </div>
    )
  }

  const total = Number(data?.total ?? 0)
  const byType = data?.byType ?? {}

  return (
    <div className="rounded-xl border border-white/5 bg-card p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          Recompensas
        </h3>
      </div>

      <div className="mb-4">
        <p className="text-2xl font-bold text-white tracking-tight">
          {total.toLocaleString()} <span className="text-sm font-normal text-slate-400">$IDEA</span>
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">Total acumulado en recompensas</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {REWARD_TYPES.map(({ key, label, icon: Icon, color }) => {
          const value = Number(byType[key] ?? 0)
          return (
            <div
              key={key}
              className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-5 text-center flex flex-col items-center justify-center"
            >
              <Icon className={`w-6 h-6 mb-3 ${color}`} />
              <p className="text-2xl font-bold text-white tracking-tight">{value.toLocaleString()}</p>
              <p className="text-sm text-slate-400 mt-1">{label}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
