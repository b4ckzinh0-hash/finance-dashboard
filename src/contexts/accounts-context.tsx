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
import type { Account } from '@/types'
import { getOfflineAccounts } from '@/lib/offline/operations'
import { cacheServerData } from '@/lib/offline/sync'

interface AccountsContextValue {
  accounts: Account[]
  loading: boolean
  isOffline: boolean
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
  refresh: () => Promise<void>
}

const AccountsContext = createContext<AccountsContextValue | undefined>(undefined)

export function AccountsProvider({ children }: { children: ReactNode }) {
  const supabase = useRef(createClient()).current
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(false)

  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    if (navigator.onLine) {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('is_active', true)
        .order('name')
      if (!error && data) {
        setAccounts((data as Account[]) ?? [])
        setIsOffline(false)
        cacheServerData().catch(() => {})
      } else {
        const local = await getOfflineAccounts()
        setAccounts(local as Account[])
        setIsOffline(true)
      }
    } else {
      const local = await getOfflineAccounts()
      setAccounts(local as Account[])
      setIsOffline(true)
    }
    setLoading(false)
  // supabase is a stable ref — will never change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetchAccounts]
  )

  const updateAccount = useCallback(
    async (id: string, payload: Partial<Account>) => {
      const { error } = await supabase.from('accounts').update(payload).eq('id', id)
      if (!error) await fetchAccounts()
      return { error }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetchAccounts]
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetchAccounts]
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

      // Delegate to a DB function so both balance updates and transaction
      // records are committed atomically inside a single transaction.
      const { error } = await supabase.rpc('transfer_between_accounts', {
        p_user_id: user.id,
        p_from_account: fromAccountId,
        p_to_account: toAccountId,
        p_amount: amount,
        p_description: description,
        p_date: date,
      })

      if (!error) await fetchAccounts()
      return { error }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetchAccounts]
  )

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)

  return (
    <AccountsContext.Provider
      value={{
        accounts,
        loading,
        isOffline,
        totalBalance,
        addAccount,
        updateAccount,
        deleteAccount,
        transferBetweenAccounts,
        refresh: fetchAccounts,
      }}
    >
      {children}
    </AccountsContext.Provider>
  )
}

export function useAccountsContext(): AccountsContextValue {
  const ctx = useContext(AccountsContext)
  if (!ctx) throw new Error('useAccountsContext must be used inside <AccountsProvider>')
  return ctx
}
