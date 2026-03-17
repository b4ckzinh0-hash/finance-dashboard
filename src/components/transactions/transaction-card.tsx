"use client"

import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PAYMENT_METHODS } from '@/lib/constants'
import type { Transaction } from '@/types'
import { cn } from '@/lib/utils'

interface TransactionCardProps {
  transaction: Transaction
  onEdit: () => void
  onDelete: () => void
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)
}

function paymentLabel(method: string): string {
  return PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method
}

export function TransactionCard({ transaction: t, onEdit, onDelete }: TransactionCardProps) {
  const isIncome = t.type === 'income'
  const isExpense = t.type === 'expense'
  const isTransfer = t.type === 'transfer'

  return (
    <div className="bg-card border rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        {/* Category icon + description */}
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
            style={
              t.category
                ? { backgroundColor: t.category.color + '22', color: t.category.color }
                : { backgroundColor: '#3B82F622', color: '#3B82F6' }
            }
          >
            {t.category?.icon ?? (isTransfer ? '↔' : isIncome ? '💰' : '💸')}
          </span>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{t.description}</p>
            {t.category && (
              <p className="text-xs text-muted-foreground">{t.category.name}</p>
            )}
          </div>
        </div>

        {/* Amount */}
        <span
          className={cn(
            'font-bold text-base tabular-nums shrink-0',
            isIncome && 'text-emerald-600',
            isExpense && 'text-rose-600',
            isTransfer && 'text-blue-600'
          )}
        >
          {isExpense ? '-' : '+'}{formatCurrency(t.amount)}
        </span>
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">
            {format(parseISO(t.date), "d 'de' MMM", { locale: ptBR })}
          </span>
          {t.account && (
            <span className="text-xs text-muted-foreground">· {t.account.name}</span>
          )}
          <Badge variant="secondary" className="text-xs font-normal h-5">
            {paymentLabel(t.payment_method)}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
