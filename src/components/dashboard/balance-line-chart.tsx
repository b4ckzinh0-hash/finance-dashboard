"use client"

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useTransactions } from '@/hooks/use-transactions'
import { useAccounts } from '@/hooks/use-accounts'
import { formatCurrency, getMonthName } from '@/lib/utils'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-sm mb-1">{label}</p>
        <p className="text-primary font-bold">{formatCurrency(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

export function BalanceLineChart() {
  const { transactions, loading: txLoading } = useTransactions()
  const { totalBalance, loading: accLoading } = useAccounts()
  const loading = txLoading || accLoading

  const data = useMemo(() => {
    const now = new Date()
    const months = Array.from({ length: 6 }, (_, i) => subMonths(now, 5 - i))

    // Calculate net change per month
    const monthlyNet = months.map((month) => {
      const from = format(startOfMonth(month), 'yyyy-MM-dd')
      const to = format(endOfMonth(month), 'yyyy-MM-dd')
      const income = transactions
        .filter((t) => t.type === 'income' && t.date >= from && t.date <= to)
        .reduce((sum, t) => sum + t.amount, 0)
      const expenses = transactions
        .filter((t) => t.type === 'expense' && t.date >= from && t.date <= to)
        .reduce((sum, t) => sum + t.amount, 0)
      return income - expenses
    })

    // Reconstruct balance history by working backwards from current balance
    const balances: number[] = new Array(6)
    let balance = totalBalance
    for (let i = 5; i >= 0; i--) {
      balances[i] = balance
      balance -= monthlyNet[i]
    }

    return months.map((month, i) => ({
      name: getMonthName(month.getMonth()),
      balance: balances[i],
    }))
  }, [transactions, totalBalance])

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
        <CardTitle className="text-base font-semibold">Evolução do Saldo</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={264}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
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
            <Line
              type="monotone"
              dataKey="balance"
              stroke="url(#balanceGradient)"
              strokeWidth={2.5}
              dot={{ fill: '#6366f1', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
