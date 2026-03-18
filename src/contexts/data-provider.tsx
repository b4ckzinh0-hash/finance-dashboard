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
import type { Transaction, Account, Category, TransactionFilters } from '@/types'
import {
  getOfflineTransactions,
  getOfflineAccounts,
  getOfflineCategories,
  addOfflineTransaction,
  updateOfflineTransaction,
  deleteOfflineTransaction,
} from '@/lib/offline/operations'
import { cacheTransactions, cacheAccounts, cacheCategories } from '@/lib/offline/sync'

interface DataContextValue {
  // Transactions
  transactions: Transaction[]
  transactionsLoading: boolean
  transactionsOffline: boolean
  addTransaction: (
    payload: Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => Promise<{ error: Error | null }>
  updateTransaction: (id: string, payload: Partial<Transaction>) => Promise<{ error: unknown }>
  deleteTransaction: (id: string) => Promise<{ error: unknown }>
  filterTransactions: (filters: TransactionFilters) => Transaction[]
  refreshTransactions: () => Promise<void>

  // Accounts
  accounts: Account[]
  accountsLoading: boolean
  accountsOffline: boolean
  totalBalance: number
  addAccount: (
    payload: Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => Promise<{ error: unknown }>
  updateAccount: (id: string, payload: Partial<Account>) => Promise<{ error: unknown }>
  deleteAccount: (id: string) => Promise<{ error: unknown }>
  transferBetweenAccounts: (
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    description: string,
    date: string
  ) => Promise<{ error: unknown }>
  refreshAccounts: () => Promise<void>

  // Categories
  categories: Category[]
  expenseCategories: Category[]
  incomeCategories: Category[]
  categoriesLoading: boolean
  categoriesOffline: boolean
  addCategory: (
    payload: Omit<Category, 'id' | 'user_id' | 'created_at' | 'is_default'>
  ) => Promise<{ error: unknown }>
  updateCategory: (id: string, payload: Partial<Category>) => Promise<{ error: unknown }>
  deleteCategory: (id: string) => Promise<{ error: unknown }>
  refreshCategories: () => Promise<void>

  // Combined
  loading: boolean
  isOffline: boolean
  refresh: () => Promise<void>
}

const DataContext = createContext<DataContextValue | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const supabase = useRef(createClient()).current

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [transactionsLoading, setTransactionsLoading] = useState(true)
  const [transactionsOffline, setTransactionsOffline] = useState(false)

  const [accounts, setAccounts] = useState<Account[]>([])
  const [accountsLoading, setAccountsLoading] = useState(true)
  const [accountsOffline, setAccountsOffline] = useState(false)

  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesOffline, setCategoriesOffline] = useState(false)

  // ── Individual refreshers ────────────────────────────────────────────────

  const refreshTransactions = useCallback(async () => {
    setTransactionsLoading(true)
    if (navigator.onLine) {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, account:accounts(*), category:categories(*)')
        .order('date', { ascending: false })
      if (!error && data) {
        setTransactions(data as Transaction[])
        setTransactionsOffline(false)
        cacheTransactions(data as Record<string, unknown>[]).catch(() => {})
      } else {
        const local = await getOfflineTransactions()
        setTransactions(local as Transaction[])
        setTransactionsOffline(true)
      }
    } else {
      const local = await getOfflineTransactions()
      setTransactions(local as Transaction[])
      setTransactionsOffline(true)
    }
    setTransactionsLoading(false)
  // supabase is a stable ref — will never change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refreshAccounts = useCallback(async () => {
    setAccountsLoading(true)
    if (navigator.onLine) {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('is_active', true)
        .order('name')
      if (!error && data) {
        setAccounts(data as Account[])
        setAccountsOffline(false)
        cacheAccounts(data as Record<string, unknown>[]).catch(() => {})
      } else {
        const local = await getOfflineAccounts()
        setAccounts(local as Account[])
        setAccountsOffline(true)
      }
    } else {
      const local = await getOfflineAccounts()
      setAccounts(local as Account[])
      setAccountsOffline(true)
    }
    setAccountsLoading(false)
  // supabase is a stable ref — will never change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refreshCategories = useCallback(async () => {
    setCategoriesLoading(true)
    if (navigator.onLine) {
      const { data, error } = await supabase.from('categories').select('*').order('name')
      if (!error && data) {
        setCategories(data as Category[])
        setCategoriesOffline(false)
        cacheCategories(data as Record<string, unknown>[]).catch(() => {})
      } else {
        const local = await getOfflineCategories()
        setCategories(local as Category[])
        setCategoriesOffline(true)
      }
    } else {
      const local = await getOfflineCategories()
      setCategories(local as Category[])
      setCategoriesOffline(true)
    }
    setCategoriesLoading(false)
  // supabase is a stable ref — will never change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Parallel initial fetch ───────────────────────────────────────────────

  const refresh = useCallback(async () => {
    await Promise.all([refreshTransactions(), refreshAccounts(), refreshCategories()])
  }, [refreshTransactions, refreshAccounts, refreshCategories])

  useEffect(() => { refresh() }, [refresh])

  // ── Transaction mutations ────────────────────────────────────────────────

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
        await refreshTransactions()
        return { error: null }
      }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { error: new Error('Not authenticated') }
      const { error } = await supabase
        .from('transactions')
        .insert({ ...payload, user_id: user.id })
      if (!error) await refreshTransactions()
      return { error: error as Error | null }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshTransactions]
  )

  const updateTransaction = useCallback(
    async (id: string, payload: Partial<Transaction>) => {
      if (!navigator.onLine) {
        await updateOfflineTransaction(id, payload as Record<string, unknown>)
        await refreshTransactions()
        return { error: null }
      }
      const { error } = await supabase.from('transactions').update(payload).eq('id', id)
      if (!error) await refreshTransactions()
      return { error }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshTransactions]
  )

  const deleteTransaction = useCallback(
    async (id: string) => {
      if (!navigator.onLine) {
        await deleteOfflineTransaction(id)
        await refreshTransactions()
        return { error: null }
      }
      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (!error) await refreshTransactions()
      return { error }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshTransactions]
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

  // ── Account mutations ────────────────────────────────────────────────────

  const addAccount = useCallback(
    async (payload: Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { error: new Error('Not authenticated') }
      const { error } = await supabase
        .from('accounts')
        .insert({ ...payload, user_id: user.id })
      if (!error) await refreshAccounts()
      return { error }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshAccounts]
  )

  const updateAccount = useCallback(
    async (id: string, payload: Partial<Account>) => {
      const { error } = await supabase.from('accounts').update(payload).eq('id', id)
      if (!error) await refreshAccounts()
      return { error }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshAccounts]
  )

  const deleteAccount = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from('accounts')
        .update({ is_active: false })
        .eq('id', id)
      if (!error) await refreshAccounts()
      return { error }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshAccounts]
  )

  const transferBetweenAccounts = useCallback(
    async (
      fromAccountId: string,
      toAccountId: string,
      amount: number,
      description: string,
      date: string
    ) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { error: new Error('Not authenticated') }
      const { error } = await supabase.rpc('transfer_between_accounts', {
        p_user_id: user.id,
        p_from_account: fromAccountId,
        p_to_account: toAccountId,
        p_amount: amount,
        p_description: description,
        p_date: date,
      })
      if (!error) await refreshAccounts()
      return { error }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshAccounts]
  )

  // ── Category mutations ───────────────────────────────────────────────────

  const addCategory = useCallback(
    async (payload: Omit<Category, 'id' | 'user_id' | 'created_at' | 'is_default'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { error: new Error('Not authenticated') }
      const { error } = await supabase
        .from('categories')
        .insert({ ...payload, user_id: user.id, is_default: false })
      if (!error) await refreshCategories()
      return { error }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshCategories]
  )

  const updateCategory = useCallback(
    async (id: string, payload: Partial<Category>) => {
      const { error } = await supabase.from('categories').update(payload).eq('id', id)
      if (!error) await refreshCategories()
      return { error }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshCategories]
  )

  const deleteCategory = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (!error) await refreshCategories()
      return { error }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refreshCategories]
  )

  // ── Derived values ───────────────────────────────────────────────────────

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)
  const expenseCategories = categories.filter((c) => c.type === 'expense')
  const incomeCategories = categories.filter((c) => c.type === 'income')
  const loading = transactionsLoading || accountsLoading || categoriesLoading
  const isOffline = transactionsOffline || accountsOffline || categoriesOffline

  return (
    <DataContext.Provider
      value={{
        transactions,
        transactionsLoading,
        transactionsOffline,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        filterTransactions,
        refreshTransactions,
        accounts,
        accountsLoading,
        accountsOffline,
        totalBalance,
        addAccount,
        updateAccount,
        deleteAccount,
        transferBetweenAccounts,
        refreshAccounts,
        categories,
        expenseCategories,
        incomeCategories,
        categoriesLoading,
        categoriesOffline,
        addCategory,
        updateCategory,
        deleteCategory,
        refreshCategories,
        loading,
        isOffline,
        refresh,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

// ── Convenience hooks mirroring the old individual-provider APIs ───────────

export function useDataContext(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useDataContext must be used inside <DataProvider>')
  return ctx
}

export function useTransactionsContext() {
  const ctx = useDataContext()
  return {
    transactions: ctx.transactions,
    loading: ctx.transactionsLoading,
    isOffline: ctx.transactionsOffline,
    addTransaction: ctx.addTransaction,
    updateTransaction: ctx.updateTransaction,
    deleteTransaction: ctx.deleteTransaction,
    filterTransactions: ctx.filterTransactions,
    refresh: ctx.refreshTransactions,
  }
}

export function useAccountsContext() {
  const ctx = useDataContext()
  return {
    accounts: ctx.accounts,
    loading: ctx.accountsLoading,
    isOffline: ctx.accountsOffline,
    totalBalance: ctx.totalBalance,
    addAccount: ctx.addAccount,
    updateAccount: ctx.updateAccount,
    deleteAccount: ctx.deleteAccount,
    transferBetweenAccounts: ctx.transferBetweenAccounts,
    refresh: ctx.refreshAccounts,
  }
}

export function useCategoriesContext() {
  const ctx = useDataContext()
  return {
    categories: ctx.categories,
    expenseCategories: ctx.expenseCategories,
    incomeCategories: ctx.incomeCategories,
    loading: ctx.categoriesLoading,
    isOffline: ctx.categoriesOffline,
    addCategory: ctx.addCategory,
    updateCategory: ctx.updateCategory,
    deleteCategory: ctx.deleteCategory,
    refresh: ctx.refreshCategories,
  }
}
