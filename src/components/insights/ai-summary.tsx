'use client'

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useTransactions } from '@/hooks/use-transactions'
import { useGoals } from '@/hooks/use-goals'
import { formatCurrency } from '@/lib/utils'

function ScoreGauge({ score }: { score: number }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const color = score > 70 ? '#22C55E' : score > 40 ? '#EAB308' : '#EF4444'
  const progress = (score / 100) * circumference

  return (
    <div className="relative flex items-center justify-center">
      <svg width={128} height={128} viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="#27272a" strokeWidth="12" />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 64 64)"
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-bold text-white">{score.toFixed(0)}</p>
        <p className="text-xs text-zinc-400">/ 100</p>
      </div>
    </div>
  )
}

export default function AiSummary() {
  const { transactions, loading: txLoading } = useTransactions()
  const { activeGoals, loading: goalsLoading } = useGoals()

  const loading = txLoading || goalsLoading

  const { income, expenses, savings, score } = useMemo(() => {
    const now = new Date()
    const month = now.getMonth()
    const year = now.getFullYear()

    const thisMonth = transactions.filter((t) => {
      const d = new Date(t.date)
      return d.getMonth() === month && d.getFullYear() === year
    })

    const income = thisMonth.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expenses = thisMonth.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const savings = income - expenses

    const savingsScore = income > 0 ? Math.min((savings / income) * 40, 40) : 0
    const goalScore =
      activeGoals.length > 0
        ? (activeGoals.reduce((s, g) => s + Math.min(g.current_amount / (g.target_amount || 1), 1), 0) /
            activeGoals.length) *
          30
        : 15
    const budgetScore =
      expenses <= income ? 30 : Math.max(0, 30 - ((expenses - income) / (income || 1)) * 30)

    return { income, expenses, savings, score: Math.round(savingsScore + goalScore + budgetScore) }
  }, [transactions, activeGoals])

  if (loading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-5 w-48 bg-zinc-800" />
          <div className="flex gap-6">
            <Skeleton className="h-32 w-32 rounded-full bg-zinc-800" />
            <div className="flex-1 space-y-3 py-4">
              <Skeleton className="h-4 w-full bg-zinc-800" />
              <Skeleton className="h-4 w-3/4 bg-zinc-800" />
              <Skeleton className="h-4 w-2/3 bg-zinc-800" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const scoreLabel = score > 70 ? 'Excelente 🎉' : score > 40 ? 'Regular 📊' : 'Atenção ⚠️'
  const scoreColor = score > 70 ? 'text-emerald-400' : score > 40 ? 'text-yellow-400' : 'text-red-400'

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Resumo Financeiro do Mês</h2>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex flex-col items-center gap-1">
            <ScoreGauge score={score} />
            <p className={`text-sm font-medium ${scoreColor}`}>{scoreLabel}</p>
            <p className="text-xs text-zinc-500">Saúde Financeira</p>
          </div>

          <div className="flex-1 space-y-4">
            <p className="text-zinc-300 text-sm leading-relaxed">
              Este mês você ganhou{' '}
              <span className="font-semibold text-emerald-400">{formatCurrency(income)}</span>, gastou{' '}
              <span className="font-semibold text-red-400">{formatCurrency(expenses)}</span> e{' '}
              {savings >= 0 ? (
                <>economizou <span className="font-semibold text-violet-400">{formatCurrency(savings)}</span>.</>
              ) : (
                <>gastou mais{' '}
                  <span className="font-semibold text-red-400">{formatCurrency(Math.abs(savings))}</span>{' '}
                  do que ganhou.
                </>
              )}
            </p>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Receitas', value: income, color: 'text-emerald-400' },
                { label: 'Despesas', value: expenses, color: 'text-red-400' },
                { label: 'Economia', value: savings, color: savings >= 0 ? 'text-violet-400' : 'text-red-400' },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-zinc-800 p-3 text-center">
                  <p className={`text-lg font-bold ${item.color}`}>{formatCurrency(item.value)}</p>
                  <p className="text-xs text-zinc-400">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
