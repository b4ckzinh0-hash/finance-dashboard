'use client'

import { useState, useCallback, useEffect } from 'react'
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

export function useOpenFinance() {
  const [connectedBanks, setConnectedBanks] = useState<ConnectedBank[]>([])
  const [transactions, setTransactions] = useState<PluggyTransaction[]>([])
  const [connectToken, setConnectToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [pluggyConfigured, setPluggyConfigured] = useState(true)
  const { toast } = useToast()

  // ── Load connected items from Pluggy ────────────────────────────────────────

  const loadItems = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/pluggy/items')

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
      toast({ title: 'Erro ao carregar bancos conectados', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  // ── Open the Pluggy Connect widget ──────────────────────────────────────────

  const openConnectWidget = useCallback(
    async (itemId?: string) => {
      setConnecting(true)
      try {
        const res = await fetch('/api/pluggy/connect-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemId ? { itemId } : {}),
        })

        if (!res.ok) throw new Error('Falha ao obter token de conexão')

        const { accessToken } = await res.json()
        setConnectToken(accessToken)
      } catch (err) {
        console.error('[useOpenFinance] openConnectWidget:', err)
        toast({ title: 'Erro ao abrir widget de conexão', variant: 'destructive' })
        setConnecting(false)
      }
    },
    [toast]
  )

  const closeConnectWidget = useCallback(() => {
    setConnectToken(null)
    setConnecting(false)
  }, [])

  // ── Handle successful widget connection ─────────────────────────────────────

  const onWidgetSuccess = useCallback(
    async (itemId: string) => {
      setConnectToken(null)
      setConnecting(false)
      toast({ title: '🔄 Importando dados bancários...' })
      await loadItems()
      toast({
        title: '✅ Banco conectado com sucesso!',
        description: `Item ${itemId} importado.`,
      })
    },
    [loadItems, toast]
  )

  const onWidgetError = useCallback(
    (error: { message: string; data?: unknown }) => {
      console.error('[useOpenFinance] widget error:', error)
      setConnectToken(null)
      setConnecting(false)
      toast({ title: 'Erro ao conectar banco', description: error.message, variant: 'destructive' })
    },
    [toast]
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
        toast({ title: 'Banco desconectado.' })
      } catch (err) {
        console.error('[useOpenFinance] disconnectBank:', err)
        toast({ title: 'Erro ao desconectar banco', variant: 'destructive' })
      }
    },
    [toast]
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

        toast({
          title: `🔄 ${bank?.connectorName ?? 'Banco'} sincronizado!`,
          description: `${allTxs.length} transação(ões) importada(s).`,
        })
      } catch (err) {
        console.error('[useOpenFinance] syncBankData:', err)
        toast({ title: 'Erro ao sincronizar dados bancários', variant: 'destructive' })
      } finally {
        setSyncing(null)
      }
    },
    [connectedBanks, toast]
  )

  return {
    connectedBanks,
    transactions,
    connectToken,
    loading,
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
