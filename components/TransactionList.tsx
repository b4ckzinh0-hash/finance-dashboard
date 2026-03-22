import { Transaction } from '@/lib/supabase'

interface TransactionListProps {
  transactions: Transaction[]
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => void
}

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

const categoryIcons: Record<string, string> = {
  Alimentação: '🍔',
  Transporte: '🚗',
  Moradia: '🏠',
  Saúde: '💊',
  Educação: '📚',
  Lazer: '🎮',
  Roupas: '👕',
  Salário: '💼',
  Freelance: '💻',
  Investimentos: '📊',
  Outros: '📦',
}

export default function TransactionList({ transactions, onEdit, onDelete }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
        <p className="text-4xl mb-3">📭</p>
        <p className="text-gray-400 text-lg">Nenhuma transação encontrada</p>
        <p className="text-gray-600 text-sm mt-1">Adicione uma nova transação para começar</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white">Transações</h2>
      </div>
      <div className="divide-y divide-gray-800">
        {transactions.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between px-6 py-4 hover:bg-gray-800/50 transition"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {categoryIcons[t.category] || '💰'}
              </span>
              <div>
                <p className="text-white font-medium">{t.category}</p>
                {t.description && (
                  <p className="text-gray-500 text-sm">{t.description}</p>
                )}
                <p className="text-gray-600 text-xs">{formatDate(t.date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span
                className={`text-lg font-semibold ${
                  t.type === 'income' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {t.type === 'income' ? '+' : '-'} {formatBRL(Number(t.amount))}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(t)}
                  className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-900/30 rounded-lg transition"
                  title="Editar"
                >
                  ✏️
                </button>
                <button
                  onClick={() => onDelete(t.id)}
                  className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/30 rounded-lg transition"
                  title="Excluir"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
