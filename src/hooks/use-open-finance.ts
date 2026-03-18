'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { PluggyItem, PluggyAccount, PluggyTransaction } from '@/lib/open-finance/pluggy-types'
import type { BelvoLink, BelvoAccount, BelvoTransaction } from '@/lib/open-finance/belvo-types'
import { useToast } from '@/components/ui/use-toast'

// ── Types ──────────────────────────────────────────────────────────────────────

export type OpenFinanceProvider = 'pluggy' | 'belvo'

export interface ConnectedBank {
  itemId: string
  connectorName: string
  connectorImageUrl?: string
  connectorPrimaryColor?: string
  status: PluggyItem['status'] | BelvoLink['status']
  connectedAt: string
  updatedAt: string
  accounts: (PluggyAccount | BelvoAccount)[]
  provider: OpenFinanceProvider
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

// ── Map Belvo data to unified ConnectedBank format ─────────────────────────────

function belvoLinkToConnectedBank(
  link: BelvoLink,
  accounts: BelvoAccount[]
): ConnectedBank {
  const statusMap: Record<BelvoLink['status'], ConnectedBank['status']> = {
    valid: 'UPDATED',
    invalid: 'ERROR',
    token_required: 'WAITING_USER_INPUT',
    unconfirmed: 'WAITING_USER_INPUT',
    login_error: 'LOGIN_ERROR',
    suspended: 'OUTDATED',
  }

  const institutionName =
    link.institution_detail?.display_name ?? link.institution_detail?.name ?? link.institution

  return {
    itemId: link.id,
    connectorName: institutionName,
    connectorImageUrl: link.institution_detail?.logo ?? link.institution_detail?.icon_logo,
    connectorPrimaryColor: link.institution_detail?.primary_color,
    status: statusMap[link.status] ?? 'ERROR',
    connectedAt: link.created_at,
    updatedAt: link.last_accessed_at ?? link.created_at,
    accounts,
    provider: 'belvo',
  }
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useOpenFinance() {
  const [connectedBanks, setConnectedBanks] = useState<ConnectedBank[]>([])
  const [transactions, setTransactions] = useState<(PluggyTransaction | BelvoTransaction)[]>([])
  const [connectToken, setConnectToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [pluggyConfigured, setPluggyConfigured] = useState(true)
  const [belvoConfigured, setBelvoConfigured] = useState(false)
  const [activeProvider, setActiveProvider] = useState<OpenFinanceProvider>('pluggy')
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

  // ── Detect configured providers ────────────────────────────────────────────

  const detectProviders = useCallback(async () => {
    const cacheKey = 'providers'
    const cached = getCached<{ pluggy: boolean; belvo: boolean }>(cacheKey)
    if (cached) {
      setPluggyConfigured(cached.pluggy)
      setBelvoConfigured(cached.belvo)
      if (!cached.pluggy && cached.belvo) setActiveProvider('belvo')
      return cached
    }

    try {
      const res = await fetchWithRetry('/api/open-finance/provider')
      if (res.ok) {
        const data: { pluggy: boolean; belvo: boolean } = await res.json()
        setCached(cacheKey, data)
        setPluggyConfigured(data.pluggy)
        setBelvoConfigured(data.belvo)
        if (!data.pluggy && data.belvo) setActiveProvider('belvo')
        return data
      }
    } catch {
      // Ignore provider detection errors — fall back to Pluggy
    }
    return { pluggy: true, belvo: false }
  }, [])

  // ── Load connected items from Pluggy ───────────────────────────────────────

  const loadPluggyItems = useCallback(async (): Promise<ConnectedBank[] | null> => {
    const cacheKey = 'pluggy:items'
    const cached = getCached<ConnectedBank[]>(cacheKey)
    if (cached) return cached

    const res = await fetchWithRetry('/api/pluggy/items')

    if (res.status === 503) {
      setPluggyConfigured(false)
      return null
    }

    if (!res.ok) throw new Error('Falha ao carregar bancos conectados (Pluggy)')

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
            provider: 'pluggy' as const,
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
          provider: 'pluggy' as const,
        } satisfies ConnectedBank
      })
    )

    setCached(cacheKey, banksWithAccounts)
    return banksWithAccounts
  }, [])

  // ── Load connected links from Belvo ────────────────────────────────────────

  const loadBelvoItems = useCallback(async (): Promise<ConnectedBank[] | null> => {
    const cacheKey = 'belvo:items'
    const cached = getCached<ConnectedBank[]>(cacheKey)
    if (cached) return cached

    const res = await fetchWithRetry('/api/belvo/items')

    if (res.status === 503) {
      setBelvoConfigured(false)
      return null
    }

    if (!res.ok) throw new Error('Falha ao carregar bancos conectados (Belvo)')

    const links: BelvoLink[] = await res.json()

    const banksWithAccounts = await Promise.all(
      links.map(async (link) => {
        const accCacheKey = `belvo:accounts:${link.id}`
        const cachedAccounts = getCached<BelvoAccount[]>(accCacheKey)
        if (cachedAccounts) return belvoLinkToConnectedBank(link, cachedAccounts)

        const accRes = await fetchWithRetry(`/api/belvo/accounts?linkId=${link.id}`)
        const accounts: BelvoAccount[] = accRes.ok ? await accRes.json() : []
        setCached(accCacheKey, accounts)
        return belvoLinkToConnectedBank(link, accounts)
      })
    )

    setCached(cacheKey, banksWithAccounts)
    return banksWithAccounts
  }, [])

  // ── Main load function: try active provider, fall back to other ────────────

  const loadItems = useCallback(async () => {
    setLoading(true)
    setLoadError(false)

    try {
      const providers = await detectProviders()

      let banks: ConnectedBank[] | null = null
      let usedProvider: OpenFinanceProvider = activeProvider

      // Try primary provider
      if (activeProvider === 'pluggy' && providers.pluggy) {
        try {
          banks = await loadPluggyItems()
          usedProvider = 'pluggy'
        } catch (pluggyErr) {
          console.warn('[useOpenFinance] Pluggy failed, trying Belvo fallback:', pluggyErr)
        }
      }

      // Try Belvo if Pluggy failed or is not configured
      if (banks === null && providers.belvo) {
        try {
          banks = await loadBelvoItems()
          usedProvider = 'belvo'
          if (activeProvider !== 'belvo') setActiveProvider('belvo')
        } catch (belvoErr) {
          console.warn('[useOpenFinance] Belvo also failed:', belvoErr)
        }
      }

      // Try Pluggy if Belvo is the primary but failed
      if (banks === null && activeProvider === 'belvo' && providers.pluggy) {
        try {
          banks = await loadPluggyItems()
          setActiveProvider('pluggy')
        } catch (pluggyErr) {
          console.warn('[useOpenFinance] Pluggy fallback also failed:', pluggyErr)
        }
      }

      if (banks === null) {
        if (!providers.pluggy && !providers.belvo) {
          setPluggyConfigured(false)
        } else {
          setLoadError(true)
          toastRef.current({ title: 'Erro ao carregar bancos conectados', variant: 'destructive' })
        }
        return
      }

      setConnectedBanks(banks)
    } catch (err) {
      console.error('[useOpenFinance] loadItems:', err)
      setLoadError(true)
      toastRef.current({ title: 'Erro ao carregar bancos conectados', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [activeProvider, detectProviders, loadPluggyItems, loadBelvoItems])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  // ── Open the Connect widget ─────────────────────────────────────────────────

  const openConnectWidget = useCallback(async (itemId?: string) => {
    setConnecting(true)
    try {
      const endpoint =
        activeProvider === 'belvo' ? '/api/belvo/connect-token' : '/api/pluggy/connect-token'

      const res = await fetchWithRetry(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemId && activeProvider === 'pluggy' ? { itemId } : {}),
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
  }, [activeProvider])

  const closeConnectWidget = useCallback(() => {
    setConnectToken(null)
    setConnecting(false)
  }, [])

  // ── Handle successful widget connection ─────────────────────────────────────

  const onWidgetSuccess = useCallback(
    async (itemId: string) => {
      setConnectToken(null)
      setConnecting(false)
      invalidateCache(activeProvider === 'belvo' ? 'belvo:' : 'pluggy:')
      toastRef.current({ title: '🔄 Importando dados bancários...' })
      await loadItems()
      toastRef.current({
        title: '✅ Banco conectado com sucesso!',
        description: `Item ${itemId} importado.`,
      })
    },
    [loadItems, activeProvider]
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
      const bank = connectedBanks.find((b) => b.itemId === itemId)
      const provider = bank?.provider ?? activeProvider
      try {
        const endpoint =
          provider === 'belvo'
            ? `/api/belvo/items/${itemId}`
            : `/api/pluggy/items/${itemId}`

        const res = await fetchWithRetry(endpoint, { method: 'DELETE' })
        if (!res.ok) throw new Error('Falha ao desconectar banco')

        invalidateCache(provider === 'belvo' ? 'belvo:' : 'pluggy:')
        setConnectedBanks((prev) => prev.filter((b) => b.itemId !== itemId))
        toastRef.current({ title: 'Banco desconectado.' })
      } catch (err) {
        console.error('[useOpenFinance] disconnectBank:', err)
        toastRef.current({ title: 'Erro ao desconectar banco', variant: 'destructive' })
      }
    },
    [connectedBanks, activeProvider]
  )

  // ── Sync real data from a connected bank ────────────────────────────────────

  const syncBankData = useCallback(
    async (itemId: string) => {
      setSyncing(itemId)
      const bank = connectedBanks.find((b) => b.itemId === itemId)
      const provider = bank?.provider ?? activeProvider

      try {
        if (provider === 'belvo') {
          invalidateCache(`belvo:accounts:${itemId}`)
          const accRes = await fetchWithRetry(`/api/belvo/accounts?linkId=${itemId}`)
          if (!accRes.ok) throw new Error('Falha ao buscar contas (Belvo)')
          const accounts: BelvoAccount[] = await accRes.json()
          setCached(`belvo:accounts:${itemId}`, accounts)

          setConnectedBanks((prev) =>
            prev.map((b) => (b.itemId === itemId ? { ...b, accounts } : b))
          )

          // Belvo transactions are per link, not per account
          const txRes = await fetchWithRetry(`/api/belvo/transactions?linkId=${itemId}`)
          const allTxs: BelvoTransaction[] = txRes.ok ? await txRes.json() : []

          setTransactions((prev) => {
            const existing = (prev as BelvoTransaction[]).filter(
              (t) => t.account?.link !== itemId
            )
            return [...existing, ...allTxs]
          })

          toastRef.current({
            title: `🔄 ${bank?.connectorName ?? 'Banco'} sincronizado!`,
            description: `${allTxs.length} transação(ões) importada(s).`,
          })
        } else {
          invalidateCache(`pluggy:accounts:${itemId}`)
          const accRes = await fetchWithRetry(`/api/pluggy/accounts?itemId=${itemId}`)
          if (!accRes.ok) throw new Error('Falha ao buscar contas (Pluggy)')
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
              ...(prev as PluggyTransaction[]).filter((t) => !accountIds.has(t.accountId)),
              ...allTxs,
            ]
          })

          toastRef.current({
            title: `🔄 ${bank?.connectorName ?? 'Banco'} sincronizado!`,
            description: `${allTxs.length} transação(ões) importada(s).`,
          })
        }
      } catch (err) {
        console.error('[useOpenFinance] syncBankData:', err)
        toastRef.current({ title: 'Erro ao sincronizar dados bancários', variant: 'destructive' })
      } finally {
        setSyncing(null)
      }
    },
    [connectedBanks, activeProvider]
  )

  // ── Switch provider manually ────────────────────────────────────────────────

  const switchProvider = useCallback(
    (provider: OpenFinanceProvider) => {
      setActiveProvider(provider)
      invalidateCache()
      setConnectedBanks([])
    },
    []
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
    belvoConfigured,
    activeProvider,
    openConnectWidget,
    closeConnectWidget,
    onWidgetSuccess,
    onWidgetError,
    onWidgetClose,
    disconnectBank,
    syncBankData,
    loadItems,
    switchProvider,
  }
}
