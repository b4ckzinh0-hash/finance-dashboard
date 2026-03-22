'use client'

import { useEffect, useState } from 'react'
import { WifiOff, RefreshCw, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOffline } from '@/contexts/offline-context'

export function OfflineIndicator() {
  const { isOnline, pendingChanges, isSyncing, syncNow } = useOffline()
  const [syncSuccess, setSyncSuccess] = useState<number | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isOnline || pendingChanges > 0) {
      setVisible(true)
    } else if (syncSuccess !== null) {
      const timer = setTimeout(() => {
        setVisible(false)
        setSyncSuccess(null)
      }, 3000)
      return () => clearTimeout(timer)
    } else {
      setVisible(false)
    }
  }, [isOnline, pendingChanges, syncSuccess])

  const handleSync = async () => {
    const result = await syncNow()
    if (result.synced > 0) {
      setSyncSuccess(result.synced)
    }
  }

  if (!visible) return null

  if (syncSuccess !== null) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 text-sm font-medium">
        <CheckCircle className="h-4 w-4 shrink-0" />
        <span>{syncSuccess} alteraç{syncSuccess === 1 ? 'ão sincronizada' : 'ões sincronizadas'} com sucesso</span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-2 px-4 py-2 text-sm font-medium',
        isOnline ? 'bg-amber-500 text-white' : 'bg-slate-700 text-white'
      )}
    >
      <div className="flex items-center gap-2">
        <WifiOff className="h-4 w-4 shrink-0" />
        <span>
          {isOnline
            ? `📶 De volta online — ${pendingChanges} alteraç${pendingChanges === 1 ? 'ão pendente' : 'ões pendentes'}`
            : '📴 Modo Offline — alterações serão sincronizadas quando voltar online'}
        </span>
        {pendingChanges > 0 && (
          <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">
            {pendingChanges}
          </span>
        )}
      </div>

      {isOnline && pendingChanges > 0 && (
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 rounded-md bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30 disabled:opacity-60 transition-colors"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', isSyncing && 'animate-spin')} />
          {isSyncing ? 'Sincronizando…' : 'Sincronizar agora'}
        </button>
      )}
    </div>
  )
}
