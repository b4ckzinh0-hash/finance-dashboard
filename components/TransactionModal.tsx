'use client'

import { useState, useEffect } from 'react'
import { supabase, Transaction, CATEGORIES } from '@/lib/supabase'

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: Transaction | null
  onSuccess: () => void
}

function getTodayString() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function TransactionModal({
  isOpen,
  onClose,
  transaction,
  onSuccess,
}: TransactionModalProps) {
  const isEditing = transaction !== null

  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [date, setDate] = useState(getTodayString())
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (transaction) {
        setAmount(String(transaction.amount))
        setType(transaction.type)
        setCategory(transaction.category)
        setDate(transaction.date)
        setDescription(transaction.description ?? '')
      } else {
        setAmount('')
        setType('expense')
        setCategory(CATEGORIES[0])
        setDate(getTodayString())
        setDescription('')
      }
      setError(null)
    }
  }, [isOpen, transaction])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const parsedAmount = parseFloat(amount.replace(',', '.'))
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Informe um valor válido maior que zero.')
      return
    }

    if (!date) {
      setError('Informe a data da transação.')
      return
    }

    setLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError('Sessão expirada. Faça login novamente.')
      setLoading(false)
      return
    }

    const payload = {
      user_id: session.user.id,
      amount: parsedAmount,
      type,
      category,
      date,
      description: description.trim() || null,
    }

    if (isEditing) {
      const { error: updateError } = await supabase
        .from('transactions')
        .update(payload)
        .eq('id', transaction.id)

      if (updateError) {
        setError('Erro ao atualizar transação. Tente novamente.')
        setLoading(false)
        return
      }
    } else {
      const { error: insertError } = await supabase.from('transactions').insert(payload)

      if (insertError) {
        setError('Erro ao salvar transação. Tente novamente.')
        setLoading(false)
        return
      }
    }

    setLoading(false)
    onSuccess()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">
            {isEditing ? 'Editar Transação' : 'Nova Transação'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Type toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-2.5 rounded-xl text-sm font-medium transition ${
                  type === 'income'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
                }`}
              >
                ↑ Receita
              </button>
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2.5 rounded-xl text-sm font-medium transition ${
                  type === 'expense'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
                }`}
              >
                ↓ Despesa
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1.5">
              Valor (R$)
            </label>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="0,00"
              className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1.5">
              Categoria
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition appearance-none cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-1.5">
              Data
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition [color-scheme:dark]"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1.5">
              Descrição <span className="text-gray-500 font-normal">(opcional)</span>
            </label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Supermercado, conta de luz..."
              maxLength={200}
              className="w-full px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 text-sm">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Salvando...
                </span>
              ) : isEditing ? (
                'Salvar alterações'
              ) : (
                'Adicionar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
