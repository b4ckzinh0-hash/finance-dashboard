'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Account } from '@/types'

export function useAccounts() {
  const supabase = createClient()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('accounts')
      .select('*')
      .eq('is_active', true)
      .order('name')
    setAccounts((data as Account[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchAccounts() }, [fetchAccounts])

  const addAccount = useCallback(
    async (payload: Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return { error: new Error('Not authenticated') }

      const { error } = await supabase
        .from('accounts')
        .insert({ ...payload, user_id: user.id })
      if (!error) await fetchAccounts()
      return { error }
    },
    [supabase, fetchAccounts]
  )

  const updateAccount = useCallback(
    async (id: string, payload: Partial<Account>) => {
      const { error } = await supabase.from('accounts').update(payload).eq('id', id)
      if (!error) await fetchAccounts()
      return { error }
    },
    [supabase, fetchAccounts]
  )

  const deleteAccount = useCallback(
    async (id: string) => {
      // Soft-delete by setting is_active = false
      const { error } = await supabase
        .from('accounts')
        .update({ is_active: false })
        .eq('id', id)
      if (!error) await fetchAccounts()
      return { error }
    },
    [supabase, fetchAccounts]
  )

  const transferBetweenAccounts = useCallback(
    async (
      fromAccountId: string,
      toAccountId: string,
      amount: number,
      description: string,
      date: string
    ) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return { error: new Error('Not authenticated') }

      const fromAccount = accounts.find((a) => a.id === fromAccountId)
      const toAccount   = accounts.find((a) => a.id === toAccountId)
      if (!fromAccount || !toAccount) return { error: new Error('Account not found') }

      // Update balances
      const { error: e1 } = await supabase
        .from('accounts')
        .update({ balance: fromAccount.balance - amount })
        .eq('id', fromAccountId)
      if (e1) return { error: e1 }

      const { error: e2 } = await supabase
        .from('accounts')
        .update({ balance: toAccount.balance + amount })
        .eq('id', toAccountId)
      if (e2) return { error: e2 }

      await fetchAccounts()
      return { error: null }
    },
    [supabase, accounts, fetchAccounts]
  )

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)

  return {
    accounts,
    loading,
    totalBalance,
    addAccount,
    updateAccount,
    deleteAccount,
    transferBetweenAccounts,
    refresh: fetchAccounts,
  }
}
