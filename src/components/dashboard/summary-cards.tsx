"use client"

import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, PiggyBank } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAccountsContext } from '@/contexts/data-provider'
import { useTransactionsContext } from '@/contexts/data-provider'
import { formatCurrency } from '@/lib/utils'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

function sumByType(
  transactions: { type: string; amount: number; date: string }[],
  type: string,
  from: string,
  to: string,
): number {
  return transactions
    .filter((t) => t.type === type && t.date >= from && t.date <= to)
    .reduce((sum, t) => sum + t.amount, 0)
}

function pctChange(curr: number, prev: number): number {
  if (prev === 0) return curr > 0 ? 100 : 0
  return ((curr - prev) / Math.abs(prev)) * 100
}

export const SummaryCards = memo(function SummaryCards() {
  const { totalBalance, loading: accountsLoading } = useAccountsContext()
  const { transactions, loading: txLoading } = useTransactionsContext()
  const loading = accountsLoading || txLoading

  const metrics = useMemo(() => {
    const now = new Date()
    const thisMonthStart = format(startOfMonth(now), 'yyyy-MM-dd')
    const thisMonthEnd = format(endOfMonth(now), 'yyyy-MM-dd')
    const lastMonthStart = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd')
    const lastMonthEnd = format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd')

    const thisIncome = sumByType(transactions, 'income', thisMonthStart, thisMonthEnd)
    const thisExpenses = sumByType(transactions, 'expense', thisMonthStart, thisMonthEnd)
    const thisSavings = thisIncome - thisExpenses

    const lastIncome = sumByType(transactions, 'income', lastMonthStart, lastMonthEnd)
    const lastExpenses = sumByType(transactions, 'expense', lastMonthStart, lastMonthEnd)
    const lastSavings = lastIncome - lastExpenses

    return {
      income: { value: thisIncome, change: pctChange(thisIncome, lastIncome) },
      expenses: { value: thisExpenses, change: pctChange(thisExpenses, lastExpenses) },
      savings: { value: thisSavings, change: pctChange(thisSavings, lastSavings) },
    }
  }, [transactions])

  const cards = [
    {
      title: 'Saldo Total',
      value: totalBalance,
      change: null as number | null,
      icon: Wallet,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      invertChange: false,
    },
    {
      title: 'Receitas do Mês',
      value: metrics.income.value,
      change: metrics.income.change,
      icon: ArrowUpRight,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      invertChange: false,
    },
    {
      title: 'Despesas do Mês',
      value: metrics.expenses.value,
      change: metrics.expenses.change,
      icon: ArrowDownRight,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      invertChange: true,
    },
    {
      title: 'Economia do Mês',
      value: metrics.savings.value,
      change: metrics.savings.change,
      icon: PiggyBank,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      invertChange: false,
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="backdrop-blur-sm bg-card/80">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
    >
      {cards.map((card) => {
        const Icon = card.icon
        const isPositive = card.invertChange
          ? (card.change ?? 0) <= 0
          : (card.change ?? 0) >= 0
        const TrendIcon = isPositive ? TrendingUp : TrendingDown

        return (
          <motion.div key={card.title} variants={item}>
            <Card className="backdrop-blur-sm bg-card/80 border-border/50 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <div className={`p-2 rounded-full ${card.bg}`}>
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(card.value)}</p>
                {card.change !== null && (
                  <div
                    className={`flex items-center gap-1 mt-2 text-xs ${
                      isPositive ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    <TrendIcon className="h-3 w-3" />
                    <span>{Math.abs(card.change).toFixed(1)}% vs mês anterior</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </motion.div>
  )
})
