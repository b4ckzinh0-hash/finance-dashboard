'use client'

import { useState, useCallback } from 'react'
import {
  connectBankSimulated,
  fetchBankTransactions,
  type OpenFinanceAccount,
  type OpenFinanceTransaction,
} from '@/lib/open-finance/client'
import { useToast } from '@/components/ui/use-toast'

const STORAGE_KEY = 'open_finance_connections'

export interface ConnectedBank {
  bankId: string
  bankName: string
  consentId: string
  connectedAt: string
  accounts: OpenFinanceAccount[]
}

function loadConnections(): ConnectedBank[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveConnections(connections: ConnectedBank[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(connections))
}

export function useOpenFinance() {
  const [connectedBanks, setConnectedBanks] = useState<ConnectedBank[]>(() => loadConnections())
  const [connecting, setConnecting] = useState<string | null>(null)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [syncedTransactions, setSyncedTransactions] = useState<OpenFinanceTransaction[]>([])
  const { toast } = useToast()

  const connectBank = useCallback(async (bankId: string) => {
    setConnecting(bankId)
    try {
      const result = await connectBankSimulated(bankId)
      const newConnection: ConnectedBank = {
        bankId: result.bank.id,
        bankName: result.bank.name,
        consentId: result.consentId,
        connectedAt: new Date().toISOString(),
        accounts: result.accounts,
      }

      setConnectedBanks((prev) => {
        const filtered = prev.filter((c) => c.bankId !== bankId)
        const next = [...filtered, newConnection]
        saveConnections(next)
        return next
      })

      toast({
        title: `✅ ${result.bank.name} conectado!`,
        description: `${result.accounts.length} conta(s) encontrada(s).`,
      })
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao conectar banco', variant: 'destructive' })
    } finally {
      setConnecting(null)
    }
  }, [toast])

  const disconnectBank = useCallback((bankId: string) => {
    setConnectedBanks((prev) => {
      const next = prev.filter((c) => c.bankId !== bankId)
      saveConnections(next)
      return next
    })
    setSyncedTransactions((prev) => prev.filter((t) => t.bankId !== bankId))
    toast({ title: 'Banco desconectado.' })
  }, [toast])

  const syncBankTransactions = useCallback(async (bankId: string) => {
    const connection = connectedBanks.find((c) => c.bankId === bankId)
    if (!connection) return

    setSyncing(bankId)
    try {
      const allTxs: OpenFinanceTransaction[] = []
      for (const account of connection.accounts) {
        const txs = await fetchBankTransactions(bankId, account.id, 15)
        allTxs.push(...txs)
      }

      setSyncedTransactions((prev) => {
        const filtered = prev.filter((t) => t.bankId !== bankId)
        return [...filtered, ...allTxs]
      })

      toast({
        title: `🔄 ${connection.bankName} sincronizado!`,
        description: `${allTxs.length} transação(ões) importada(s).`,
      })
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro ao sincronizar transações', variant: 'destructive' })
    } finally {
      setSyncing(null)
    }
  }, [connectedBanks, toast])

  const isConnected = useCallback(
    (bankId: string) => connectedBanks.some((c) => c.bankId === bankId),
    [connectedBanks]
  )

  return {
    connectedBanks,
    syncedTransactions,
    connecting,
    syncing,
    connectBank,
    disconnectBank,
    syncBankTransactions,
    isConnected,
  }
}
