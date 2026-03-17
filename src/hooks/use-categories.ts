'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/types'

export function useCategories() {
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('categories').select('*').order('name')
    setCategories((data as Category[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  const addCategory = useCallback(
    async (payload: Omit<Category, 'id' | 'user_id' | 'created_at' | 'is_default'>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return { error: new Error('Not authenticated') }

      const { error } = await supabase
        .from('categories')
        .insert({ ...payload, user_id: user.id, is_default: false })
      if (!error) await fetchCategories()
      return { error }
    },
    [supabase, fetchCategories]
  )

  const updateCategory = useCallback(
    async (id: string, payload: Partial<Category>) => {
      const { error } = await supabase.from('categories').update(payload).eq('id', id)
      if (!error) await fetchCategories()
      return { error }
    },
    [supabase, fetchCategories]
  )

  const deleteCategory = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (!error) await fetchCategories()
      return { error }
    },
    [supabase, fetchCategories]
  )

  const expenseCategories = categories.filter((c) => c.type === 'expense')
  const incomeCategories  = categories.filter((c) => c.type === 'income')

  return {
    categories,
    expenseCategories,
    incomeCategories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    refresh: fetchCategories,
  }
}
