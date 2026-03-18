'use client'

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useTransactionsContext } from '@/contexts/data-provider'
import { useCategoriesContext } from '@/contexts/data-provider'
import { formatCurrency } from '@/lib/utils'

export default function SpendingPatterns() {
  const { transactions, loading: txLoading } = useTransactionsContext()
  const { categories, loading: catLoading } = useCategoriesContext()

  const loading = txLoading || catLoading

  const patterns = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const getMonthExpenses = (month: number, year: number) =>
      transactions.filter((t) => {
        const d = new Date(t.date)
        return t.type === 'expense' && d.getMonth() === month && d.getFullYear() === year
      })

    const currentExpenses = getMonthExpenses(currentMonth, currentYear)

    const prevMonths = [1, 2, 3].map((offset) => {
      let m = currentMonth - offset
      let y = currentYear
      if (m < 0) { m += 12; y -= 1 }
      return getMonthExpenses(m, y)
    })

    const catMap = new Map<string, { current: number; avg: number; name: string; icon: string; color: string }>()

    categories.filter((c) => c.type === 'expense').forEach((cat) => {
      const current = currentExpenses.filter((t) => t.category_id === cat.id).reduce((s, t) => s + t.amount, 0)
      const totals = prevMonths.map((month) =>
        month.filter((t) => t.category_id === cat.id).reduce((s, t) => s + t.amount, 0)
      )
      const avg = totals.reduce((s, v) => s + v, 0) / 3
      catMap.set(cat.id, { current, avg, name: cat.name, icon: cat.icon, color: cat.color })
    })

    return Array.from(catMap.values())
      .filter((c) => c.current > 0)
      .sort((a, b) => b.current - a.current)
      .slice(0, 5)
  }, [transactions, categories])

  if (loading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-5 space-y-3">
          <Skeleton className="h-5 w-40 bg-zinc-800" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-32 bg-zinc-800" />
              <Skeleton className="h-5 w-20 bg-zinc-800" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="p-5">
        <h2 className="text-lg font-semibold text-white mb-4">Padrões de Gastos</h2>
        {patterns.length === 0 ? (
          <p className="text-zinc-400 text-sm">Sem dados suficientes para análise.</p>
        ) : (
          <div className="space-y-3">
            {patterns.map((p) => {
              const pct = p.avg > 0 ? ((p.current - p.avg) / p.avg) * 100 : 0
              const isUp = pct > 0
              return (
                <div key={p.name} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm"
                      style={{ backgroundColor: `${p.color}22` }}
                    >
                      {p.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{p.name}</p>
                      <p className="text-xs text-zinc-500">
                        Média: {formatCurrency(p.avg)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-sm font-semibold text-white">{formatCurrency(p.current)}</span>
                    {p.avg > 0 && (
                      <Badge
                        variant="outline"
                        className={`text-xs border-0 px-1.5 py-0 ${isUp ? 'bg-red-950 text-red-400' : 'bg-emerald-950 text-emerald-400'}`}
                      >
                        {isUp ? <TrendingUp className="mr-1 h-3 w-3 inline" /> : <TrendingDown className="mr-1 h-3 w-3 inline" />}
                        {Math.abs(pct).toFixed(0)}% {isUp ? 'a mais' : 'a menos'}
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
