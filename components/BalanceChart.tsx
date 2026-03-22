'use client'

import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Transaction } from '@/lib/supabase'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

interface BalanceChartProps {
  transactions: Transaction[]
}

export default function BalanceChart({ transactions }: BalanceChartProps) {
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date))

  let running = 0
  const dailyMap: Record<string, number> = {}
  for (const t of sorted) {
    running += t.type === 'income' ? Number(t.amount) : -Number(t.amount)
    dailyMap[t.date] = running
  }

  const labels = Object.keys(dailyMap)
  const values = Object.values(dailyMap)

  const formattedLabels = labels.map((d) => {
    const [year, month, day] = d.split('-')
    return `${day}/${month}/${year}`
  })

  if (labels.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col items-center justify-center min-h-[280px]">
        <p className="text-gray-500 text-center">Nenhuma transação para exibir no gráfico</p>
      </div>
    )
  }

  const data = {
    labels: formattedLabels,
    datasets: [
      {
        label: 'Saldo',
        data: values,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#3b82f6',
        pointRadius: 4,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: '#9ca3af',
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx: { raw: unknown }) => {
            const val = Number(ctx.raw)
            return ` Saldo: ${val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#6b7280' },
        grid: { color: '#1f2937' },
      },
      y: {
        ticks: {
          color: '#6b7280',
          callback: (value: number | string) =>
            Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        },
        grid: { color: '#1f2937' },
      },
    },
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Evolução do Saldo</h2>
      <Line data={data} options={options} />
    </div>
  )
}
