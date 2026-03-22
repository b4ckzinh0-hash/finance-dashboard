'use client'

import { Info, AlertTriangle, CheckCircle, XCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNotificationContext } from '@/contexts/notification-context'
import { cn } from '@/lib/utils'
import type { NotificationType } from '@/types'

const icons: Record<NotificationType, React.ElementType> = {
  info: Info, warning: AlertTriangle, success: CheckCircle, error: XCircle,
}
const iconColors: Record<NotificationType, string> = {
  info: 'text-blue-400', warning: 'text-yellow-400', success: 'text-emerald-400', error: 'text-red-400',
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'há poucos minutos'
  if (h < 24) return `há ${h} hora${h > 1 ? 's' : ''}`
  const d = Math.floor(h / 24)
  return `há ${d} dia${d > 1 ? 's' : ''}`
}

interface NotificationPanelProps {
  open: boolean
  onClose: () => void
}

export default function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotificationContext()

  if (!open) return null

  return (
    <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <span className="font-semibold text-white">Notificações</span>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-7 text-xs text-zinc-400 hover:text-white" onClick={() => markAllAsRead()}>
            Marcar todas
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-400 hover:text-white" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-400">Nenhuma notificação</p>
        ) : (
          notifications.map((n) => {
            const Icon = icons[n.type]
            return (
              <div
                key={n.id}
                className={cn('flex gap-3 px-4 py-3 border-b border-zinc-800 cursor-pointer hover:bg-zinc-800/50', !n.is_read && 'bg-violet-950/20')}
                onClick={() => markAsRead(n.id)}
              >
                <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', iconColors[n.type])} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{n.title}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{n.message}</p>
                  <p className="text-xs text-zinc-600 mt-1">{relativeTime(n.created_at)}</p>
                </div>
                <Button size="icon" variant="ghost" className="h-6 w-6 flex-shrink-0 text-zinc-600 hover:text-red-400"
                  onClick={(e) => { e.stopPropagation(); deleteNotification(n.id) }}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
