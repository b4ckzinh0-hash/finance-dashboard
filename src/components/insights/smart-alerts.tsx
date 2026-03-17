'use client'

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, Info, DollarSign, Calendar } from 'lucide-react'
import { useTransactions } from '@/hooks/use-transactions'
import { useAccounts } from '@/hooks/use-accounts'
import { usePlanning } from '@/hooks/use-planning'
import { useCategories } from '@/hooks/use-categories'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Alert {
  id: string
  title: string
  message: string
  severity: 'warning' | 'info' | 'error'
}

export default function SmartAlerts() {
  const { transactions, loading: txLoading } = useTransactions()
  const { totalBalance, loading: accLoading } = useAccounts()
  const { recurringExpenses, loading: planLoading } = usePlanning()
  const { categories, loading: catLoading } = useCategories()

  const loading = txLoading || accLoading || planLoading || catLoading

  const alerts = useMemo<Alert[]>(() => {
    const result: Alert[] = []
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

    // Alert 1: category overspending
    categories.filter((c) => c.type === 'expense').forEach((cat) => {
      const current = currentExpenses.filter((t) => t.category_id === cat.id).reduce((s, t) => s + t.amount, 0)
      const totals = prevMonths.map((m) => m.filter((t) => t.category_id === cat.id).reduce((s, t) => s + t.amount, 0))
      const avg = totals.reduce((s, v) => s + v, 0) / 3
      if (avg > 0 && current > avg * 1.5) {
        result.push({
          id: `cat-${cat.id}`,
          title: `Gastos elevados em ${cat.name}`,
          message: `Você gastou ${formatCurrency(current)} este mês, ${((current / avg - 1) * 100).toFixed(0)}% acima da média de ${formatCurrency(avg)}.`,
          severity: 'warning',
        })
      }
    })

    // Alert 2: low balance
    const thisMonthIncome = transactions.filter((t) => {
      const d = new Date(t.date)
      return t.type === 'income' && d.getMonth() === currentMonth && d.getFullYear() === currentYear
    }).reduce((s, t) => s + t.amount, 0)

    if (thisMonthIncome > 0 && totalBalance < thisMonthIncome * 0.1) {
      result.push({
        id: 'low-balance',
        title: 'Saldo baixo',
        message: `Seu saldo total (${formatCurrency(totalBalance)}) está abaixo de 10% da sua renda mensal.`,
        severity: 'error',
      })
    }

    // Alert 3: upcoming bills
    const in3Days = new Date(now.getTime() + 3 * 86400000)
    recurringExpenses.forEach((e) => {
      if (!e.is_active) return
      const due = new Date(e.next_due_date)
      if (due >= now && due <= in3Days) {
        const days = Math.ceil((due.getTime() - now.getTime()) / 86400000)
        result.push({
          id: `bill-${e.id}`,
          title: `Vencimento próximo: ${e.name}`,
          message: `${formatCurrency(e.amount)} vence em ${days === 0 ? 'hoje' : `${days} dia${days > 1 ? 's' : ''}`}.`,
          severity: 'info',
        })
      }
    })

    return result
  }, [transactions, totalBalance, recurringExpenses, categories])

  if (loading) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-5 space-y-3">
          <Skeleton className="h-5 w-36 bg-zinc-800" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full bg-zinc-800" />
          ))}
        </CardContent>
      </Card>
    )
  }

  const severityConfig = {
    warning: { icon: AlertTriangle, bg: 'bg-yellow-950/40 border-yellow-800', iconColor: 'text-yellow-400' },
    error: { icon: DollarSign, bg: 'bg-red-950/40 border-red-800', iconColor: 'text-red-400' },
    info: { icon: Calendar, bg: 'bg-blue-950/40 border-blue-800', iconColor: 'text-blue-400' },
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardContent className="p-5">
        <h2 className="text-lg font-semibold text-white mb-4">Alertas Inteligentes</h2>
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-2xl mb-2">🎉</p>
            <p className="text-zinc-400 text-sm">Nenhum alerta no momento</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const { icon: Icon, bg, iconColor } = severityConfig[alert.severity]
              return (
                <div key={alert.id} className={cn('flex gap-3 rounded-lg border p-3', bg)}>
                  <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', iconColor)} />
                  <div>
                    <p className="text-sm font-medium text-white">{alert.title}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{alert.message}</p>
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
