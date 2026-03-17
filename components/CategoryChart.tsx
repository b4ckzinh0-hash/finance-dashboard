'use client'

import { useMemo } from 'react'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Transaction, CATEGORY_COLORS } from '@/lib/supabase'

ChartJS.register(ArcElement, Tooltip, Legend)

interface CategoryChartProps {
  transactions: Transaction[]
}

export default function CategoryChart({ transactions }: CategoryChartProps) {
  const expenses = transactions.filter((t) => t.type === 'expense')

  const chartData = useMemo(() => {
    const totals: Record<string, number> = {}
    for (const t of expenses) {
      totals[t.category] = (totals[t.category] ?? 0) + t.amount
    }

    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1])
    const labels = sorted.map(([cat]) => cat)
    const data = sorted.map(([, val]) => val)
    const backgroundColor = labels.map((cat) => CATEGORY_COLORS[cat] ?? '#94a3b8')

    return { labels, data, backgroundColor }
  }, [expenses])

  const isEmpty = chartData.data.length === 0

  const data = {
    labels: chartData.labels,
    datasets: [
      {
        data: chartData.data,
        backgroundColor: chartData.backgroundColor,
        borderColor: chartData.backgroundColor.map((c) => c),
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#9ca3af',
          padding: 16,
          font: { size: 12 },
          usePointStyle: true,
          pointStyleWidth: 8,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: { parsed: number; label: string }) => {
            const total = chartData.data.reduce((a, b) => a + b, 0)
            const pct = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : '0'
            const formatted = new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(context.parsed)
            return ` ${context.label}: ${formatted} (${pct}%)`
          },
        },
        backgroundColor: '#1f2937',
        titleColor: '#f9fafb',
        bodyColor: '#d1d5db',
        borderColor: '#374151',
        borderWidth: 1,
      },
    },
  }

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
      <h2 className="text-base font-semibold text-white mb-4">Despesas por Categoria</h2>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
            />
          </svg>
          <p className="text-sm">Sem dados</p>
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="w-full max-w-xs">
            <Doughnut data={data} options={options} />
          </div>
        </div>
      )}
    </div>
  )
}
