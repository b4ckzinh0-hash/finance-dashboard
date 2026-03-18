'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Goal } from '@/types'

export function useGoals() {
  const supabase = useRef(createClient()).current
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  const fetchGoals = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false })
    setGoals((data as Goal[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchGoals() }, [fetchGoals])

  const addGoal = useCallback(
    async (payload: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return { error: new Error('Not authenticated') }

      const { error } = await supabase
        .from('goals')
        .insert({ ...payload, user_id: user.id })
      if (!error) await fetchGoals()
      return { error }
    },
    [supabase, fetchGoals]
  )

  const updateGoal = useCallback(
    async (id: string, payload: Partial<Goal>) => {
      const { error } = await supabase.from('goals').update(payload).eq('id', id)
      if (!error) await fetchGoals()
      return { error }
    },
    [supabase, fetchGoals]
  )

  const deleteGoal = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('goals').delete().eq('id', id)
      if (!error) await fetchGoals()
      return { error }
    },
    [supabase, fetchGoals]
  )

  const contributeToGoal = useCallback(
    async (id: string, amount: number) => {
      const goal = goals.find((g) => g.id === id)
      if (!goal) return { error: new Error('Goal not found') }

      const newAmount = Math.min(goal.current_amount + amount, goal.target_amount)
      const status = newAmount >= goal.target_amount ? 'completed' : goal.status

      return updateGoal(id, { current_amount: newAmount, status })
    },
    [goals, updateGoal]
  )

  const activeGoals    = goals.filter((g) => g.status === 'active')
  const completedGoals = goals.filter((g) => g.status === 'completed')

  return {
    goals,
    activeGoals,
    completedGoals,
    loading,
    addGoal,
    updateGoal,
    deleteGoal,
    contributeToGoal,
    refresh: fetchGoals,
  }
}
