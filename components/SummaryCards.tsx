import { Transaction } from '@/lib/supabase'

interface SummaryCardsProps {
  transactions: Transaction[]
}

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function SummaryCards({ transactions }: SummaryCardsProps) {
  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const expense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const balance = income - expense

  const cards = [
    {
      title: 'Saldo Total',
      value: formatBRL(balance),
      icon: '💳',
      color: balance >= 0 ? 'text-green-400' : 'text-red-400',
      bg: 'bg-gray-800 border-gray-700',
    },
    {
      title: 'Receitas',
      value: formatBRL(income),
      icon: '📈',
      color: 'text-green-400',
      bg: 'bg-green-900/20 border-green-800/40',
    },
    {
      title: 'Despesas',
      value: formatBRL(expense),
      icon: '📉',
      color: 'text-red-400',
      bg: 'bg-red-900/20 border-red-800/40',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`${card.bg} border rounded-xl p-6 flex items-center gap-4`}
        >
          <span className="text-4xl">{card.icon}</span>
          <div>
            <p className="text-gray-400 text-sm">{card.title}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
