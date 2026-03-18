'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { PluggyItem, PluggyAccount, PluggyTransaction } from '@/lib/open-finance/pluggy-types'
import { useToast } from '@/components/ui/use-toast'

// ── Types ──────────────────────────────────────────────────────────────────────

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

// ── Constants ──────────────────────────────────────────────────────────────────

/** Timeout (ms) for fetch calls to API routes. */
const FETCH_TIMEOUT_MS = 10_000
/** Timeout (ms) to auto-reset the connecting spinner if the widget never opens. */
const WIDGET_OPEN_TIMEOUT_MS = 10_000
/** Safety timeout (ms) — force-reset connecting if still true after this long. */
const CONNECTING_SAFETY_TIMEOUT_MS = 30_000
/** Cache TTL in milliseconds (30 seconds). */
const CACHE_TTL_MS = 30_000
/** Max number of retry attempts for failed requests. */
const MAX_RETRIES = 2
/** Base delay for exponential backoff (ms). */
const RETRY_BASE_DELAY_MS = 500

// ── In-memory cache ────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T
  timestamp: number
}

const cache = new Map<string, CacheEntry<unknown>>()

function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key)
    return null
  }
  return entry.data
}

function setCached<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() })
}

function invalidateCache(prefix?: string): void {
  if (!prefix) {
    cache.clear()
    return
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key)
  }
}

// ── Retry helper ───────────────────────────────────────────────────────────────

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = MAX_RETRIES
): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    return res
  } catch (err) {
    if (retries > 0 && !(err instanceof Error && err.name === 'AbortError')) {
      const delay = RETRY_BASE_DELAY_MS * (MAX_RETRIES - retries + 1)
      await new Promise((resolve) => setTimeout(resolve, delay))
      return fetchWithRetry(url, options, retries - 1)
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }
}

// ── Hook ───────────────────────────────────────────────────────────────────────

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

  // ── Load connected items from Pluggy ───────────────────────────────────────

  const loadItems = useCallback(async () => {
    setLoading(true)
    setLoadError(false)

    try {
      const cacheKey = 'pluggy:items'
      const cached = getCached<ConnectedBank[]>(cacheKey)
      if (cached) {
        setConnectedBanks(cached)
        return
      }

      const res = await fetchWithRetry('/api/pluggy/items')

      if (res.status === 503) {
        setPluggyConfigured(false)
        return
      }

      if (!res.ok) throw new Error('Falha ao carregar bancos conectados')

      const items: PluggyItem[] = await res.json()

      const banksWithAccounts = await Promise.all(
        items.map(async (item) => {
          const accCacheKey = `pluggy:accounts:${item.id}`
          const cachedAccounts = getCached<PluggyAccount[]>(accCacheKey)
          if (cachedAccounts) {
            return {
              itemId: item.id,
              connectorName: item.connector.name,
              connectorImageUrl: item.connector.imageUrl,
              connectorPrimaryColor: item.connector.primaryColor,
              status: item.status,
              connectedAt: item.createdAt,
              updatedAt: item.updatedAt,
              accounts: cachedAccounts,
            } satisfies ConnectedBank
          }

          const accRes = await fetchWithRetry(`/api/pluggy/accounts?itemId=${item.id}`)
          const accounts: PluggyAccount[] = accRes.ok ? await accRes.json() : []
          setCached(accCacheKey, accounts)
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

      setCached(cacheKey, banksWithAccounts)
      setConnectedBanks(banksWithAccounts)
    } catch (err) {
      console.error('[useOpenFinance] loadItems:', err)
      setLoadError(true)
      toastRef.current({ title: 'Erro ao carregar bancos conectados', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  // ── Open the Connect widget ─────────────────────────────────────────────────

  const openConnectWidget = useCallback(async (itemId?: string) => {
    setConnecting(true)
    try {
      const res = await fetchWithRetry('/api/pluggy/connect-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemId ? { itemId } : {}),
      })

      if (!res.ok) throw new Error('Falha ao obter token de conexão')

      const { accessToken } = await res.json()

      setTimeout(() => {
        setConnectToken((prev) => {
          if (prev === accessToken) {
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
      invalidateCache('pluggy:')
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
        const res = await fetchWithRetry(`/api/pluggy/items/${itemId}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Falha ao desconectar banco')

        invalidateCache('pluggy:')
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
        invalidateCache(`pluggy:accounts:${itemId}`)
        const accRes = await fetchWithRetry(`/api/pluggy/accounts?itemId=${itemId}`)
        if (!accRes.ok) throw new Error('Falha ao buscar contas')
        const accounts: PluggyAccount[] = await accRes.json()
        setCached(`pluggy:accounts:${itemId}`, accounts)

        setConnectedBanks((prev) =>
          prev.map((b) => (b.itemId === itemId ? { ...b, accounts } : b))
        )

        // Fetch transactions for all accounts in parallel
        const allTxResults = await Promise.all(
          accounts.map(async (acc) => {
            const txRes = await fetchWithRetry(`/api/pluggy/transactions?accountId=${acc.id}`)
            if (!txRes.ok) return []
            return (await txRes.json()) as PluggyTransaction[]
          })
        )
        const allTxs = allTxResults.flat()

        setTransactions((prev) => {
          const accountIds = new Set(accounts.map((a) => a.id))
          return [
            ...prev.filter((t) => !accountIds.has(t.accountId)),
            ...allTxs,
          ]
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
