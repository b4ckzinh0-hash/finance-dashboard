'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { PluggyItem, PluggyAccount, PluggyTransaction } from '@/lib/open-finance/pluggy-types'
import { useToast } from '@/components/ui/use-toast'

export interface ConnectedBank {
  itemId: string
  connectorName: string
  connectorImageUrl?: string
  connectorPrimaryColor?: string
  status: PluggyItem['status']
  connectedAt: string
  updatedAt: string
  accounts: PluggyAccount[]
}

/** Timeout (ms) for fetch calls to /api/pluggy/* routes. */
const FETCH_TIMEOUT_MS = 10_000
/** Timeout (ms) to auto-reset the connecting spinner if the widget never opens. */
const WIDGET_OPEN_TIMEOUT_MS = 10_000
/** Safety timeout (ms) — force-reset connecting if still true after this long. */
const CONNECTING_SAFETY_TIMEOUT_MS = 30_000

export function useOpenFinance() {
  const [connectedBanks, setConnectedBanks] = useState<ConnectedBank[]>([])
  const [transactions, setTransactions] = useState<PluggyTransaction[]>([])
  const [connectToken, setConnectToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [pluggyConfigured, setPluggyConfigured] = useState(true)
  const { toast } = useToast()

  // Keep a stable ref to toast so callbacks don't need it as a dependency.
  const toastRef = useRef(toast)
  toastRef.current = toast

  // ── Safety timeout: auto-reset connecting after CONNECTING_SAFETY_TIMEOUT_MS ─

  useEffect(() => {
    if (!connecting) return
    const id = setTimeout(() => {
      setConnecting(false)
      setConnectToken(null)
      toastRef.current({
        title: 'Tempo esgotado ao conectar banco',
        description: 'Tente novamente.',
        variant: 'destructive',
      })
    }, CONNECTING_SAFETY_TIMEOUT_MS)
    return () => clearTimeout(id)
  }, [connecting])

  // ── Load connected items from Pluggy ────────────────────────────────────────

  const loadItems = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    try {
      const res = await fetch('/api/pluggy/items', { signal: controller.signal })

      if (res.status === 503) {
        setPluggyConfigured(false)
        return
      }

      if (!res.ok) throw new Error('Falha ao carregar bancos conectados')

      const items: PluggyItem[] = await res.json()

      // Fetch accounts for each connected item in parallel
      const banksWithAccounts = await Promise.all(
        items.map(async (item) => {
          const accRes = await fetch(`/api/pluggy/accounts?itemId=${item.id}`)
          const accounts: PluggyAccount[] = accRes.ok ? await accRes.json() : []
          return {
            itemId: item.id,
            connectorName: item.connector.name,
            connectorImageUrl: item.connector.imageUrl,
            connectorPrimaryColor: item.connector.primaryColor,
            status: item.status,
            connectedAt: item.createdAt,
            updatedAt: item.updatedAt,
            accounts,
          } satisfies ConnectedBank
        })
      )

      setConnectedBanks(banksWithAccounts)
    } catch (err) {
      console.error('[useOpenFinance] loadItems:', err)
      setLoadError(true)
      toastRef.current({ title: 'Erro ao carregar bancos conectados', variant: 'destructive' })
    } finally {
      clearTimeout(timeout)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  // ── Open the Pluggy Connect widget ──────────────────────────────────────────

  const openConnectWidget = useCallback(async (itemId?: string) => {
    setConnecting(true)
    const controller = new AbortController()
    const fetchTimeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    try {
      const res = await fetch('/api/pluggy/connect-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemId ? { itemId } : {}),
        signal: controller.signal,
      })

      if (!res.ok) throw new Error('Falha ao obter token de conexão')

      const { accessToken } = await res.json()

      // Set a timeout: if the widget doesn't open/close within WIDGET_OPEN_TIMEOUT_MS,
      // reset the spinner so the user isn't stuck.
      setTimeout(() => {
        setConnectToken((prev) => {
          if (prev === accessToken) {
            // Token still set but widget hasn't fired any callback — give up.
            setConnecting(false)
            toastRef.current({
              title: 'Não foi possível abrir o widget de conexão',
              description: 'Verifique sua conexão e tente novamente.',
              variant: 'destructive',
            })
            return null
          }
          return prev
        })
      }, WIDGET_OPEN_TIMEOUT_MS)

      setConnectToken(accessToken)
    } catch (err) {
      console.error('[useOpenFinance] openConnectWidget:', err)
      toastRef.current({ title: 'Erro ao abrir widget de conexão', variant: 'destructive' })
      setConnecting(false)
    } finally {
      clearTimeout(fetchTimeout)
    }
  }, [])

  const closeConnectWidget = useCallback(() => {
    setConnectToken(null)
    setConnecting(false)
  }, [])

  // ── Handle successful widget connection ─────────────────────────────────────

  const onWidgetSuccess = useCallback(
    async (itemId: string) => {
      setConnectToken(null)
      setConnecting(false)
      toastRef.current({ title: '🔄 Importando dados bancários...' })
      await loadItems()
      toastRef.current({
        title: '✅ Banco conectado com sucesso!',
        description: `Item ${itemId} importado.`,
      })
    },
    [loadItems]
  )

  const onWidgetError = useCallback(
    (error: { message: string; data?: unknown }) => {
      console.error('[useOpenFinance] widget error:', error)
      setConnectToken(null)
      setConnecting(false)
      toastRef.current({ title: 'Erro ao conectar banco', description: error.message, variant: 'destructive' })
    },
    []
  )

  const onWidgetClose = useCallback(() => {
    setConnectToken(null)
    setConnecting(false)
  }, [])

  // ── Disconnect a bank ───────────────────────────────────────────────────────

  const disconnectBank = useCallback(
    async (itemId: string) => {
      try {
        const res = await fetch(`/api/pluggy/items/${itemId}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Falha ao desconectar banco')

        setConnectedBanks((prev) => prev.filter((b) => b.itemId !== itemId))
        toastRef.current({ title: 'Banco desconectado.' })
      } catch (err) {
        console.error('[useOpenFinance] disconnectBank:', err)
        toastRef.current({ title: 'Erro ao desconectar banco', variant: 'destructive' })
      }
    },
    []
  )

  // ── Sync real data from a connected bank ────────────────────────────────────

  const syncBankData = useCallback(
    async (itemId: string) => {
      setSyncing(itemId)
      const bank = connectedBanks.find((b) => b.itemId === itemId)

      try {
        // Refresh accounts
        const accRes = await fetch(`/api/pluggy/accounts?itemId=${itemId}`)
        if (!accRes.ok) throw new Error('Falha ao buscar contas')
        const accounts: PluggyAccount[] = await accRes.json()

        setConnectedBanks((prev) =>
          prev.map((b) => (b.itemId === itemId ? { ...b, accounts } : b))
        )

        // Fetch transactions for all accounts
        const allTxs: PluggyTransaction[] = []
        for (const account of accounts) {
          const txRes = await fetch(`/api/pluggy/transactions?accountId=${account.id}`)
          if (txRes.ok) {
            const txs: PluggyTransaction[] = await txRes.json()
            allTxs.push(...txs)
          }
        }

        // Replace transactions for this item's accounts
        setTransactions((prev) => {
          const accountIds = new Set(accounts.map((a) => a.id))
          return [...prev.filter((t) => !accountIds.has(t.accountId)), ...allTxs]
        })

        toastRef.current({
          title: `🔄 ${bank?.connectorName ?? 'Banco'} sincronizado!`,
          description: `${allTxs.length} transação(ões) importada(s).`,
        })
      } catch (err) {
        console.error('[useOpenFinance] syncBankData:', err)
        toastRef.current({ title: 'Erro ao sincronizar dados bancários', variant: 'destructive' })
      } finally {
        setSyncing(null)
      }
    },
    [connectedBanks]
  )

  return {
    connectedBanks,
    transactions,
    connectToken,
    loading,
    loadError,
    connecting,
    syncing,
    pluggyConfigured,
    openConnectWidget,
    closeConnectWidget,
    onWidgetSuccess,
    onWidgetError,
    onWidgetClose,
    disconnectBank,
    syncBankData,
    loadItems,
  }
}
