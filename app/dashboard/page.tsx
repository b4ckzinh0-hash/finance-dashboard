'use client'

export const dynamic = 'force-dynamic'

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
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [filterMonth, setFilterMonth] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const fetchTransactions = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', session.user.id)
      .order('date', { ascending: false })

    if (!error && data) {
      setTransactions(data as Transaction[])
    }
    setLoading(false)
  }, [router])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  useEffect(() => {
    const channel = supabase
      .channel('transactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        fetchTransactions()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchTransactions])

  const filteredTransactions = transactions.filter((t) => {
    const matchMonth = t.date.startsWith(filterMonth)
    const matchCategory = filterCategory === 'all' || t.category === filterCategory
    return matchMonth && matchCategory
  })

  const categories = Array.from(new Set(transactions.map((t) => t.category)))

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta transação?')) return
    await supabase.from('transactions').delete().eq('id', id)
    fetchTransactions()
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setEditingTransaction(null)
  }

  const handleModalSave = () => {
    handleModalClose()
    fetchTransactions()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Header onAddTransaction={() => setModalOpen(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Filters
          filterMonth={filterMonth}
          filterCategory={filterCategory}
          categories={categories}
          onMonthChange={setFilterMonth}
          onCategoryChange={setFilterCategory}
        />

        <SummaryCards transactions={filteredTransactions} />

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

      {modalOpen && (
        <TransactionModal
          transaction={editingTransaction}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
    </div>
  )
}
