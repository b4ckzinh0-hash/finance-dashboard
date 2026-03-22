'use client'

import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Transaction } from '@/lib/supabase'

ChartJS.register(ArcElement, Tooltip, Legend)

interface CategoryChartProps {
  transactions: Transaction[]
}

const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
]

export default function CategoryChart({ transactions }: CategoryChartProps) {
  const expenses = transactions.filter((t) => t.type === 'expense')

  const categoryTotals = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + Number(t.amount)
    return acc
  }, {} as Record<string, number>)

  const labels = Object.keys(categoryTotals)
  const values = Object.values(categoryTotals)

  if (labels.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col items-center justify-center min-h-[280px]">
        <p className="text-gray-500 text-center">Nenhuma despesa para exibir no gráfico</p>
      </div>
    )
  }

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: COLORS.slice(0, labels.length),
        borderColor: '#111827',
        borderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#9ca3af',
          padding: 12,
          font: { size: 12 },
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx: { label: string; raw: unknown }) => {
            const val = Number(ctx.raw)
            return ` ${ctx.label}: ${val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
          },
        },
      },
    },
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Despesas por Categoria</h2>
      <div className="max-h-72 flex items-center justify-center">
        <Doughnut data={data} options={options} />
      </div>
    </div>
  )
}
