'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Transaction, TransactionFilters } from '@/types'
import {
  getOfflineTransactions,
  addOfflineTransaction,
  updateOfflineTransaction,
  deleteOfflineTransaction,
} from '@/lib/offline/operations'
import { cacheTransactions } from '@/lib/offline/sync'

export function useTransactions() {
  const supabase = useRef(createClient()).current
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(false)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    if (navigator.onLine) {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, account:accounts(*), category:categories(*)')
        .order('date', { ascending: false })
      if (!error && data) {
        setTransactions((data as Transaction[]) ?? [])
        setIsOffline(false)
        // Cache to IndexedDB in the background
        cacheTransactions(data as Record<string, unknown>[]).catch(() => {})
      } else {
        // Network request failed — fall back to local cache
        const local = await getOfflineTransactions()
        setTransactions(local as Transaction[])
        setIsOffline(true)
      }
    } else {
      const local = await getOfflineTransactions()
      setTransactions(local as Transaction[])
      setIsOffline(true)
    }
    setLoading(false)
  // supabase is a stable ref — will never change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  const addTransaction = useCallback(
    async (payload: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!navigator.onLine) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: new Error('Not authenticated') }
        const now = new Date().toISOString()
        const record: Transaction = {
          ...payload,
          id: crypto.randomUUID(),
          user_id: user.id,
          created_at: now,
          updated_at: now,
        }
        await addOfflineTransaction(record as unknown as Record<string, unknown>)
        await fetchTransactions()
        return { error: null }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return { error: new Error('Not authenticated') }

      const { error } = await supabase
        .from('transactions')
        .insert({ ...payload, user_id: user.id })
      if (!error) {
        await fetchTransactions()
      }
      return { error }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetchTransactions]
  )

  const updateTransaction = useCallback(
    async (id: string, payload: Partial<Transaction>) => {
      if (!navigator.onLine) {
        await updateOfflineTransaction(id, payload as Record<string, unknown>)
        await fetchTransactions()
        return { error: null }
      }

      const { error } = await supabase
        .from('transactions')
        .update(payload)
        .eq('id', id)
      if (!error) await fetchTransactions()
      return { error }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetchTransactions]
  )

  const deleteTransaction = useCallback(
    async (id: string) => {
      if (!navigator.onLine) {
        await deleteOfflineTransaction(id)
        await fetchTransactions()
        return { error: null }
      }

      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (!error) await fetchTransactions()
      return { error }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetchTransactions]
  )

  const filterTransactions = useCallback(
    (filters: TransactionFilters): Transaction[] => {
      return transactions.filter((t) => {
        if (filters.type && t.type !== filters.type) return false
        if (filters.category_id && t.category_id !== filters.category_id) return false
        if (filters.account_id && t.account_id !== filters.account_id) return false
        if (filters.date_from && t.date < filters.date_from) return false
        if (filters.date_to && t.date > filters.date_to) return false
        if (filters.search) {
          const q = filters.search.toLowerCase()
          if (!t.description.toLowerCase().includes(q)) return false
        }
        return true
      })
    },
    [transactions]
  )

  return {
    transactions,
    loading,
    isOffline,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    filterTransactions,
    refresh: fetchTransactions,
  }
}
