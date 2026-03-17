"use client"

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useTransactions } from '@/hooks/use-transactions'
import { formatCurrency, getMonthName } from '@/lib/utils'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-sm mb-2">{label}</p>
        {payload.map((entry) => (
          <p key={entry.name} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function MonthlyBarChart() {
  const { transactions, loading } = useTransactions()

  const data = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const month = subMonths(now, 5 - i)
      const from = format(startOfMonth(month), 'yyyy-MM-dd')
      const to = format(endOfMonth(month), 'yyyy-MM-dd')

      const income = transactions
        .filter((t) => t.type === 'income' && t.date >= from && t.date <= to)
        .reduce((sum, t) => sum + t.amount, 0)

      const expenses = transactions
        .filter((t) => t.type === 'expense' && t.date >= from && t.date <= to)
        .reduce((sum, t) => sum + t.amount, 0)

      return {
        name: getMonthName(month.getMonth()),
        Receitas: income,
        Despesas: expenses,
      }
    })
  }, [transactions])

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
        <CardTitle className="text-base font-semibold">Receitas vs Despesas</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={264}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => (
                <span className="text-xs text-foreground">{value}</span>
              )}
            />
            <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
