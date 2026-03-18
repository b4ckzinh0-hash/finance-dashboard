'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/types'
import { getOfflineCategories } from '@/lib/offline/operations'
import { cacheCategories } from '@/lib/offline/sync'

interface CategoriesContextValue {
  categories: Category[]
  expenseCategories: Category[]
  incomeCategories: Category[]
  loading: boolean
  isOffline: boolean
  addCategory: (
    payload: Omit<Category, 'id' | 'user_id' | 'created_at' | 'is_default'>
  ) => Promise<{ error: unknown }>
  updateCategory: (id: string, payload: Partial<Category>) => Promise<{ error: unknown }>
  deleteCategory: (id: string) => Promise<{ error: unknown }>
  refresh: () => Promise<void>
}

const CategoriesContext = createContext<CategoriesContextValue | undefined>(undefined)

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const supabase = useRef(createClient()).current
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(false)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    if (navigator.onLine) {
      const { data, error } = await supabase.from('categories').select('*').order('name')
      if (!error && data) {
        setCategories((data as Category[]) ?? [])
        setIsOffline(false)
        cacheCategories(data as Record<string, unknown>[]).catch(() => {})
      } else {
        const local = await getOfflineCategories()
        setCategories(local as Category[])
        setIsOffline(true)
      }
    } else {
      const local = await getOfflineCategories()
      setCategories(local as Category[])
      setIsOffline(true)
    }
    setLoading(false)
  // supabase is a stable ref — will never change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetchCategories]
  )

  const updateCategory = useCallback(
    async (id: string, payload: Partial<Category>) => {
      const { error } = await supabase.from('categories').update(payload).eq('id', id)
      if (!error) await fetchCategories()
      return { error }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetchCategories]
  )

  const deleteCategory = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (!error) await fetchCategories()
      return { error }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetchCategories]
  )

  const expenseCategories = categories.filter((c) => c.type === 'expense')
  const incomeCategories = categories.filter((c) => c.type === 'income')

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        expenseCategories,
        incomeCategories,
        loading,
        isOffline,
        addCategory,
        updateCategory,
        deleteCategory,
        refresh: fetchCategories,
      }}
    >
      {children}
    </CategoriesContext.Provider>
  )
}

export function useCategoriesContext(): CategoriesContextValue {
  const ctx = useContext(CategoriesContext)
  if (!ctx) throw new Error('useCategoriesContext must be used inside <CategoriesProvider>')
  return ctx
}
