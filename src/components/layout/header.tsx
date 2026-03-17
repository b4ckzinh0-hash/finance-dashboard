'use client'

import Link from 'next/link'
import { useNotifications } from '@/hooks/use-notifications'
import { useAuth } from '@/contexts/auth-context'
import { getInitials } from '@/lib/utils'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserMenu } from '@/components/layout/user-menu'

export function Header() {
  const { profile, user } = useAuth()
  const { unreadCount } = useNotifications()

  const displayName = profile?.full_name ?? user?.email ?? ''
  const initials = displayName ? getInitials(displayName) : '?'

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-sm px-4 md:px-6">
      {/* Mobile logo */}
      <Link href="/dashboard" className="md:hidden">
        <span className="text-lg font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
          FinanceApp
        </span>
      </Link>

      {/* Desktop spacer */}
      <div className="hidden md:block" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <Button variant="ghost" size="icon" className="relative" asChild>
          <Link href="/settings">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge
                className="absolute -top-1 -right-1 h-4 w-4 min-w-0 p-0 flex items-center justify-center text-[10px] bg-violet-600 border-0"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
            <span className="sr-only">Notificações</span>
          </Link>
        </Button>

        {/* User menu */}
        <UserMenu initials={initials} displayName={displayName} avatarUrl={profile?.avatar_url ?? null} />
      </div>
    </header>
  )
}
