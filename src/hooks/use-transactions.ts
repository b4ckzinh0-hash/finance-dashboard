'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Transaction, TransactionFilters } from '@/types'

export function useTransactions() {
  const supabase = createClient()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('transactions')
      .select('*, account:accounts(*), category:categories(*)')
      .order('date', { ascending: false })
    setTransactions((data as Transaction[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  const addTransaction = useCallback(
    async (payload: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return { error: new Error('Not authenticated') }

      const { error } = await supabase
        .from('transactions')
        .insert({ ...payload, user_id: user.id })
      if (!error) await fetchTransactions()
      return { error }
    },
    [supabase, fetchTransactions]
  )

  const updateTransaction = useCallback(
    async (id: string, payload: Partial<Transaction>) => {
      const { error } = await supabase
        .from('transactions')
        .update(payload)
        .eq('id', id)
      if (!error) await fetchTransactions()
      return { error }
    },
    [supabase, fetchTransactions]
  )

  const deleteTransaction = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (!error) await fetchTransactions()
      return { error }
    },
    [supabase, fetchTransactions]
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
    addTransaction,
    updateTransaction,
    deleteTransaction,
    filterTransactions,
    refresh: fetchTransactions,
  }
}
