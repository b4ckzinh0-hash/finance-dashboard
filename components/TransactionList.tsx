'use client'

import { useState } from 'react'
import { Transaction, CATEGORY_COLORS } from '@/lib/supabase'

interface TransactionListProps {
  transactions: Transaction[]
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => void
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

export default function TransactionList({ transactions, onEdit, onDelete }: TransactionListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  async function handleDeleteClick(id: string) {
    if (confirmDeleteId === id) {
      setDeletingId(id)
      await onDelete(id)
      setDeletingId(null)
      setConfirmDeleteId(null)
    } else {
      setConfirmDeleteId(id)
    }
  }

  function handleCancelDelete() {
    setConfirmDeleteId(null)
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-12 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-800 mb-4">
          <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <p className="text-gray-400 font-medium">Nenhuma transação encontrada</p>
        <p className="text-gray-600 text-sm mt-1">
          Adicione sua primeira transação clicando no botão +
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Transações</h2>
        <span className="text-sm text-gray-400">{transactions.length} {transactions.length === 1 ? 'item' : 'itens'}</span>
      </div>

      <div className="divide-y divide-gray-800 max-h-[500px] overflow-y-auto">
        {transactions.map((transaction) => {
          const categoryColor = CATEGORY_COLORS[transaction.category] ?? '#94a3b8'
          const isConfirmingDelete = confirmDeleteId === transaction.id
          const isDeleting = deletingId === transaction.id

          return (
            <div
              key={transaction.id}
              className="flex items-center gap-4 px-6 py-4 hover:bg-gray-800/50 transition group"
            >
              {/* Category color dot */}
              <div
                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: categoryColor + '33', color: categoryColor }}
              >
                {transaction.category.slice(0, 2).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {transaction.description || transaction.category}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: categoryColor + '22', color: categoryColor }}
                  >
                    {transaction.category}
                  </span>
                  <span className="text-xs text-gray-500">{formatDate(transaction.date)}</span>
                </div>
              </div>

              {/* Amount */}
              <div className="flex-shrink-0 text-right">
                <p
                  className={`text-sm font-semibold ${
                    transaction.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                {isConfirmingDelete ? (
                  <>
                    <button
                      onClick={() => handleDeleteClick(transaction.id)}
                      disabled={isDeleting}
                      className="px-2 py-1 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition disabled:opacity-50"
                    >
                      {isDeleting ? '...' : 'Confirmar'}
                    </button>
                    <button
                      onClick={handleCancelDelete}
                      className="px-2 py-1 text-xs bg-gray-700 text-gray-300 hover:bg-gray-600 rounded-lg transition"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => onEdit(transaction)}
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
                      aria-label="Editar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteClick(transaction.id)}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition"
                      aria-label="Excluir"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
