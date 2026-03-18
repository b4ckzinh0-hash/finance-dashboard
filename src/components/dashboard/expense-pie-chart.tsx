"use client"

import { memo, useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useTransactionsContext } from '@/contexts/data-provider'
import { useCategoriesContext } from '@/contexts/data-provider'
import { formatCurrency } from '@/lib/utils'
import { startOfMonth, endOfMonth, format } from 'date-fns'

const FALLBACK_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
]

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (active && payload && payload.length) {
    const { name, value } = payload[0]
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-sm">{name}</p>
        <p className="text-primary font-bold">{formatCurrency(value)}</p>
      </div>
    )
  }
  return null
}

export const ExpensePieChart = memo(function ExpensePieChart() {
  const { transactions, loading: txLoading } = useTransactionsContext()
  const { categories, loading: catLoading } = useCategoriesContext()
  const loading = txLoading || catLoading

  const data = useMemo(() => {
    const now = new Date()
    const from = format(startOfMonth(now), 'yyyy-MM-dd')
    const to = format(endOfMonth(now), 'yyyy-MM-dd')

    const expenses = transactions.filter(
      (t) => t.type === 'expense' && t.date >= from && t.date <= to,
    )

    const byCategory: Record<string, number> = {}
    for (const t of expenses) {
      byCategory[t.category_id] = (byCategory[t.category_id] ?? 0) + t.amount
    }

    return Object.entries(byCategory)
      .map(([categoryId, total], i) => {
        const cat = categories.find((c) => c.id === categoryId)
        return {
          name: cat?.name ?? 'Sem categoria',
          value: total,
          color: cat?.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
        }
      })
      .sort((a, b) => b.value - a.value)
  }, [transactions, categories])

  if (loading) {
    return (
      <Card className="backdrop-blur-sm bg-card/80 border-border/50">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="backdrop-blur-sm bg-card/80 border-border/50">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Despesas por Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            Nenhuma despesa registrada este mês
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => (
                  <span className="text-xs text-foreground">{value}</span>
                )}
                iconSize={10}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
})
