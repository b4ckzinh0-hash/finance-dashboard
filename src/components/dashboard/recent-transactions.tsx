"use client"

import { memo, useMemo } from 'react'
import Link from 'next/link'
import { useTransactionsContext } from '@/contexts/data-provider'
import { useCategoriesContext } from '@/contexts/data-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate } from '@/lib/utils'

export const RecentTransactions = memo(function RecentTransactions() {
  const { transactions, loading: txLoading } = useTransactionsContext()
  const { categories, loading: catLoading } = useCategoriesContext()
  const loading = txLoading || catLoading

  const recent = useMemo(() => transactions.slice(0, 5), [transactions])

  if (loading) {
    return (
      <Card className="backdrop-blur-sm bg-card/80 border-border/50">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-16 shrink-0" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="backdrop-blur-sm bg-card/80 border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Transações Recentes</CardTitle>
        <Link href="/transactions" className="text-sm text-primary hover:underline font-medium">
          Ver todas
        </Link>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhuma transação registrada
          </p>
        ) : (
          <ul className="space-y-4">
            {recent.map((transaction) => {
              const category =
                transaction.category ??
                categories.find((c) => c.id === transaction.category_id)
              const isIncome = transaction.type === 'income'

              return (
                <li key={transaction.id} className="flex items-center gap-3">
                  <div
                    className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-bold"
                    style={{ backgroundColor: category?.color ?? '#6b7280' }}
                  >
                    {category?.icon ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {category?.name ?? 'Sem categoria'} · {formatDate(transaction.date)}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-semibold shrink-0 ${
                      isIncome ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {isIncome ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
})
