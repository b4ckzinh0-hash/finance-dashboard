'use client'

import { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js'
import { Transaction } from '@/lib/supabase'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
)

interface BalanceChartProps {
  transactions: Transaction[]
}

function formatDateLabel(dateStr: string) {
  const [, month, day] = dateStr.split('-')
  return `${day}/${month}`
}

export default function BalanceChart({ transactions }: BalanceChartProps) {
  const chartData = useMemo(() => {
    if (transactions.length === 0) return null

    const sorted = [...transactions].sort((a, b) => (a.date > b.date ? 1 : -1))

    const dailyNet: Record<string, number> = {}
    for (const t of sorted) {
      const delta = t.type === 'income' ? t.amount : -t.amount
      dailyNet[t.date] = (dailyNet[t.date] ?? 0) + delta
    }

    const sortedDates = Object.keys(dailyNet).sort()
    const labels = sortedDates.map(formatDateLabel)

    let running = 0
    const balances = sortedDates.map((d) => {
      running += dailyNet[d]
      return parseFloat(running.toFixed(2))
    })

    return { labels, balances }
  }, [transactions])

  const isEmpty = !chartData || chartData.labels.length === 0

  const data = chartData
    ? {
        labels: chartData.labels,
        datasets: [
          {
            label: 'Saldo',
            data: chartData.balances,
            fill: true,
            borderColor: '#7c5cff',
            backgroundColor: 'rgba(124, 92, 255, 0.1)',
            pointBackgroundColor: '#7c5cff',
            pointBorderColor: '#7c5cff',
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.4,
            borderWidth: 2,
          },
        ],
      }
    : { labels: [], datasets: [] }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: { parsed: { y: number | null } }) => {
            const formatted = new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(context.parsed.y ?? 0)
            return ` Saldo: ${formatted}`
          },
        },
        backgroundColor: '#1f2937',
        titleColor: '#f9fafb',
        bodyColor: '#d1d5db',
        borderColor: '#374151',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#6b7280', font: { size: 11 } },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: {
          color: '#6b7280',
          font: { size: 11 },
          callback: (value: number | string) => {
            if (typeof value === 'number') {
              return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                notation: 'compact',
              }).format(value)
            }
            return value
          },
        },
      },
    },
  }

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
      <h2 className="text-base font-semibold text-white mb-4">Saldo ao Longo do Tempo</h2>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
            />
          </svg>
          <p className="text-sm">Sem dados</p>
        </div>
      ) : (
        <Line data={data} options={options} />
      )}
    </div>
  )
}
