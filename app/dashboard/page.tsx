'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Transaction } from '@/lib/supabase'
import Header from '@/components/Header'
import SummaryCards from '@/components/SummaryCards'
import TransactionList from '@/components/TransactionList'
import TransactionModal from '@/components/TransactionModal'
import CategoryChart from '@/components/CategoryChart'
import BalanceChart from '@/components/BalanceChart'
import Filters from '@/components/Filters'

export default function DashboardPage() {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string>('')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  )
  const [selectedCategory, setSelectedCategory] = useState('Todas')

  const fetchTransactions = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    if (!error && data) {
      setTransactions(data as Transaction[])
    }
  }, [])

  useEffect(() => {
    let channelRef: ReturnType<typeof supabase.channel> | null = null

    async function init() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/login')
        return
      }

      const userId = session.user.id
      setUserEmail(session.user.email ?? '')
      await fetchTransactions(userId)
      setLoading(false)

      channelRef = supabase
        .channel('transactions-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'transactions',
            filter: `user_id=eq.${userId}`,
          },
          () => {
            fetchTransactions(userId)
          }
        )
        .subscribe()
    }

    init()

    return () => {
      if (channelRef) {
        supabase.removeChannel(channelRef)
      }
    }
  }, [router, fetchTransactions])

  const filteredTransactions = transactions.filter((t) => {
    const monthMatch = t.date.startsWith(selectedMonth)
    const categoryMatch = selectedCategory === 'Todas' || t.category === selectedCategory
    return monthMatch && categoryMatch
  })

  async function handleDelete(id: string) {
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (error) {
      setDeleteError('Erro ao excluir transação. Tente novamente.')
      setTimeout(() => setDeleteError(null), 4000)
    }
  }

  function handleEdit(transaction: Transaction) {
    setEditingTransaction(transaction)
    setModalOpen(true)
  }

  function handleModalClose() {
    setModalOpen(false)
    setEditingTransaction(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-400 text-sm">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Header userEmail={userEmail} />

      {/* Delete error toast */}
      {deleteError && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-red-500/20 border border-red-500/40 text-red-400 px-4 py-3 rounded-xl text-sm shadow-lg">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {deleteError}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <SummaryCards transactions={filteredTransactions} />

        <Filters
          selectedMonth={selectedMonth}
          selectedCategory={selectedCategory}
          onMonthChange={setSelectedMonth}
          onCategoryChange={setSelectedCategory}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CategoryChart transactions={filteredTransactions} />
          <BalanceChart transactions={filteredTransactions} />
        </div>

        <TransactionList
          transactions={filteredTransactions}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => {
          setEditingTransaction(null)
          setModalOpen(true)
        }}
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-950 z-40"
        aria-label="Nova transação"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <TransactionModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        transaction={editingTransaction}
        onSuccess={handleModalClose}
      />
    </div>
  )
}
