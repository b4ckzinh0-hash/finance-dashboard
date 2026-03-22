'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useNotifications } from '@/hooks/use-notifications'
import type { Notification } from '@/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => any

interface NotificationContextValue {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  markAsRead: AnyFn
  markAllAsRead: AnyFn
  deleteNotification: AnyFn
  refresh: AnyFn
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const value = useNotifications()
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotificationContext() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotificationContext must be used within NotificationProvider')
  return ctx
}
