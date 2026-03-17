'use client'

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useTransactions } from '@/hooks/use-transactions'
import { useCategories } from '@/hooks/use-categories'
import { formatCurrency } from '@/lib/utils'

export default function SavingsSuggestions() {
  const { transactions, loading: txLoading } = useTransactions()
  const { categories, loading: catLoading } = useCategories()

  const loading = txLoading || catLoading

  const suggestions = useMemo(() => {
    const now = new Date()
    const currentExpenses = transactions.filter((t) => {
      const d = new Date(t.date)
      return t.type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })

    const catTotals = categories
      .filter((c) => c.type === 'expense')
      .map((cat) => ({
        ...cat,
        total: currentExpenses.filter((t) => t.category_id === cat.id).reduce((s, t) => s + t.amount, 0),
      }))
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 3)

    return catTotals
  }, [transactions, categories])

  if (loading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-5 space-y-4">
          <Skeleton className="h-5 w-44 bg-zinc-800" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4 bg-zinc-800" />
              <Skeleton className="h-2 w-full bg-zinc-800" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  const maxAmount = Math.max(...suggestions.map((s) => s.total), 1)

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="p-5">
        <h2 className="text-lg font-semibold text-white mb-1">Sugestões de Economia</h2>
        <p className="text-sm text-zinc-400 mb-4">Reduza gastos para aumentar suas economias</p>
        {suggestions.length === 0 ? (
          <p className="text-zinc-400 text-sm">Sem transações suficientes para sugestões.</p>
        ) : (
          <div className="space-y-4">
            {suggestions.map((cat) => {
              const saving = cat.total * 0.1
              return (
                <div key={cat.id} className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{cat.icon}</span>
                      <p className="text-sm text-zinc-200">
                        Se você reduzir seus gastos com{' '}
                        <span className="font-semibold text-white">{cat.name}</span> em 10%,
                        economizaria{' '}
                        <span className="font-semibold text-emerald-400">{formatCurrency(saving)}</span> por mês.
                      </p>
                    </div>
                    <span className="flex-shrink-0 text-sm font-semibold text-white">{formatCurrency(cat.total)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(cat.total / maxAmount) * 100}%`,
                        backgroundColor: cat.color,
                      }}
                    />
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
