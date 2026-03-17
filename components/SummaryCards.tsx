'use client'

import { Transaction } from '@/lib/supabase'

interface SummaryCardsProps {
  transactions: Transaction[]
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default function SummaryCards({ transactions }: SummaryCardsProps) {
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const balance = totalIncome - totalExpenses

  const cards = [
    {
      label: 'Saldo Total',
      value: balance,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
      colorClass: balance >= 0 ? 'text-emerald-400' : 'text-red-400',
      bgClass: balance >= 0 ? 'bg-emerald-400/10' : 'bg-red-400/10',
      trend: balance >= 0 ? 'up' : 'down',
    },
    {
      label: 'Total Receitas',
      value: totalIncome,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 11l5-5m0 0l5 5m-5-5v12"
          />
        </svg>
      ),
      colorClass: 'text-emerald-400',
      bgClass: 'bg-emerald-400/10',
      trend: 'up',
    },
    {
      label: 'Total Despesas',
      value: totalExpenses,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 13l-5 5m0 0l-5-5m5 5V6"
          />
        </svg>
      ),
      colorClass: 'text-red-400',
      bgClass: 'bg-red-400/10',
      trend: 'down',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-gray-900 rounded-2xl p-6 border border-gray-800 flex items-center gap-4"
        >
          <div className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-xl ${card.bgClass} ${card.colorClass}`}>
            {card.icon}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-gray-400 truncate">{card.label}</p>
            <p className={`text-xl font-bold mt-0.5 truncate ${card.colorClass}`}>
              {formatCurrency(card.value)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
