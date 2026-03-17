'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RecurringExpense } from '@/types'

export function usePlanning() {
  const supabase = createClient()
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRecurring = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('recurring_expenses')
      .select('*, account:accounts(*), category:categories(*)')
      .order('next_due_date', { ascending: true })
    setRecurringExpenses((data as RecurringExpense[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchRecurring() }, [fetchRecurring])

  const addRecurringExpense = useCallback(
    async (
      payload: Omit<RecurringExpense, 'id' | 'user_id' | 'created_at'>
    ) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return { error: new Error('Not authenticated') }

      const { error } = await supabase
        .from('recurring_expenses')
        .insert({ ...payload, user_id: user.id })
      if (!error) await fetchRecurring()
      return { error }
    },
    [supabase, fetchRecurring]
  )

  const updateRecurringExpense = useCallback(
    async (id: string, payload: Partial<RecurringExpense>) => {
      const { error } = await supabase
        .from('recurring_expenses')
        .update(payload)
        .eq('id', id)
      if (!error) await fetchRecurring()
      return { error }
    },
    [supabase, fetchRecurring]
  )

  const deleteRecurringExpense = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from('recurring_expenses')
        .delete()
        .eq('id', id)
      if (!error) await fetchRecurring()
      return { error }
    },
    [supabase, fetchRecurring]
  )

  const toggleActive = useCallback(
    async (id: string, isActive: boolean) =>
      updateRecurringExpense(id, { is_active: isActive }),
    [updateRecurringExpense]
  )

  const totalMonthlyCommitments = useMemo(
    () =>
      recurringExpenses
        .filter((r) => r.is_active && r.frequency === 'monthly')
        .reduce((sum, r) => sum + r.amount, 0),
    [recurringExpenses]
  )

  return {
    recurringExpenses,
    loading,
    totalMonthlyCommitments,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    toggleActive,
    refresh: fetchRecurring,
  }
}
