import {
  ArrowLeftRight,
  TrendingUp,
  Coins,
  ClipboardCheck,
  RefreshCw,
  Store,
  BellOff,
} from 'lucide-react'
import { useNotifications, useMarkAsRead } from '@/hooks/use-notifications'
import { cn } from '@/lib/utils'

const NOTIFICATION_ICONS = {
  WALLET_TRANSFER: ArrowLeftRight,
  INVESTMENT_CONFIRMED: TrendingUp,
  DIVIDEND_DISTRIBUTED: Coins,
  PROJECT_AUDITED: ClipboardCheck,
  PROJECT_STATE_CHANGED: RefreshCw,
  MARKETPLACE: Store,
}

function timeAgo(dateString) {
  const now = new Date()
  const date = new Date(dateString)
  const seconds = Math.floor((now - date) / 1000)

  if (seconds < 60) return 'hace un momento'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes} min`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} hs`

  const days = Math.floor(hours / 24)
  if (days < 7) return `hace ${days} d`

  const weeks = Math.floor(days / 7)
  return `hace ${weeks} sem`
}

export function NotificationPanel({ unreadCount = 0 }) {
  const { data, isLoading, isError, error } = useNotifications()
  const markAsRead = useMarkAsRead()

  const notifications = data?.content ?? (Array.isArray(data) ? data : [])

  function handleClick(notification) {
    if (!notification.leida) {
      markAsRead.mutate(notification.id)
    }
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h3 className="text-sm font-semibold text-white">Notificaciones</h3>
        {unreadCount > 0 && (
          <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs font-medium text-violet-400">
            {unreadCount} sin leer
          </span>
        )}
      </div>

      {/* List */}
      <div className="max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <span className="text-sm text-slate-500">Cargando...</span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8">
            <span className="text-sm text-red-400">
              Error: {error?.message ?? 'No se pudieron cargar'}
            </span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8">
            <BellOff className="h-8 w-8 text-slate-600" />
            <span className="text-sm text-slate-500">
              No tenés notificaciones
            </span>
          </div>
        ) : (
          notifications.map((notification) => {
            const Icon =
              NOTIFICATION_ICONS[notification.type] ?? ArrowLeftRight

            return (
              <button
                key={notification.id}
                onClick={() => handleClick(notification)}
                className={cn(
                  'flex w-full items-start gap-3 border-b border-white/5 px-4 py-3 text-left transition-colors hover:bg-white/5',
                  !notification.leida && 'bg-violet-500/5'
                )}
              >
                <div
                  className={cn(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    notification.leida
                      ? 'bg-slate-800 text-slate-400'
                      : 'bg-violet-500/20 text-violet-400'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        'truncate text-sm',
                        notification.leida
                          ? 'text-slate-400'
                          : 'font-medium text-white'
                      )}
                    >
                      {notification.title}
                    </span>
                    {!notification.leida && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-violet-500" />
                    )}
                  </div>
                  <p className="line-clamp-2 text-xs text-slate-500">
                    {notification.message}
                  </p>
                  <span className="text-xs text-slate-600">
                    {timeAgo(notification.createdAt)}
                  </span>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
