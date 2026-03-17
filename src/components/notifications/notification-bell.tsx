'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNotificationContext } from '@/contexts/notification-context'
import NotificationPanel from './notification-panel'

export default function NotificationBell() {
  const { unreadCount } = useNotificationContext()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <Button size="icon" variant="ghost" className="relative text-zinc-400 hover:text-white" onClick={() => setOpen((v) => !v)}>
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>
      <NotificationPanel open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
