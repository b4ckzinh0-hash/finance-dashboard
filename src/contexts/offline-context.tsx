'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { getPendingSyncCount } from '@/lib/offline/operations'
import { syncWithServer, cacheServerData } from '@/lib/offline/sync'

interface OfflineContextValue {
  isOnline: boolean
  pendingChanges: number
  isSyncing: boolean
  syncNow: () => Promise<{ synced: number; errors: number }>
  refreshPendingCount: () => Promise<void>
}

const OfflineContext = createContext<OfflineContextValue | null>(null)

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingChanges, setPendingChanges] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getPendingSyncCount()
      setPendingChanges(count)
    } catch {
      // IndexedDB not available (e.g., SSR)
    }
  }, [])

  const syncNow = useCallback(async () => {
    setIsSyncing(true)
    try {
      const result = await syncWithServer()
      if (result.synced > 0) {
        await cacheServerData()
      }
      await refreshPendingCount()
      return result
    } finally {
      setIsSyncing(false)
    }
  }, [refreshPendingCount])

  useEffect(() => {
    if (typeof window === 'undefined') return

    setIsOnline(navigator.onLine)

    const handleOnline = async () => {
      setIsOnline(true)
      await syncNow()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    refreshPendingCount()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [syncNow, refreshPendingCount])

  return (
    <OfflineContext.Provider
      value={{ isOnline, pendingChanges, isSyncing, syncNow, refreshPendingCount }}
    >
      {children}
    </OfflineContext.Provider>
  )
}

export function useOffline(): OfflineContextValue {
  const ctx = useContext(OfflineContext)
  if (!ctx) throw new Error('useOffline must be used within <OfflineProvider>')
  return ctx
}
