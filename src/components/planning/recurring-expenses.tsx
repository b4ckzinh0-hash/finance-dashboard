'use client'

import { Pencil, Trash2, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { usePlanning } from '@/hooks/use-planning'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { FREQUENCY_OPTIONS } from '@/lib/constants'
import type { RecurringExpense } from '@/types'

interface RecurringExpensesProps {
  onEdit: (expense: RecurringExpense) => void
}

export default function RecurringExpenses({ onEdit }: RecurringExpensesProps) {
  const { recurringExpenses, loading, deleteRecurringExpense, toggleActive } = usePlanning()
  const { toast } = useToast()

  async function handleDelete(id: string) {
    const { error } = await deleteRecurringExpense(id)
    if (error) {
      toast({ title: 'Erro ao excluir', description: String(error), variant: 'destructive' })
    } else {
      toast({ title: 'Despesa recorrente excluída' })
    }
  }

  async function handleToggle(id: string, current: boolean) {
    const { error } = await toggleActive(id, !current)
    if (error) {
      toast({ title: 'Erro ao atualizar', description: String(error), variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-zinc-900 border-zinc-800">
            <CardContent className="flex items-center justify-between p-4">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-40 bg-zinc-800" />
                <Skeleton className="h-3 w-24 bg-zinc-800" />
              </div>
              <Skeleton className="h-8 w-20 bg-zinc-800" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (recurringExpenses.length === 0) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-6 text-center text-zinc-400">
          Nenhuma despesa recorrente cadastrada.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {recurringExpenses.map((expense) => {
        const freqLabel = FREQUENCY_OPTIONS.find((f) => f.value === expense.frequency)?.label ?? expense.frequency
        return (
          <Card key={expense.id} className="bg-zinc-900 border-zinc-800">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="text-xl">{expense.category?.icon ?? '📋'}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white">{expense.name}</p>
                    {!expense.is_active && (
                      <Badge variant="outline" className="border-zinc-600 text-zinc-500 text-xs">Inativo</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span>{expense.category?.name ?? '—'}</span>
                    <span>•</span>
                    <span>{freqLabel}</span>
                    <span>•</span>
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(expense.next_due_date)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-white">{formatCurrency(expense.amount)}</span>
                <Switch
                  checked={expense.is_active}
                  onCheckedChange={() => handleToggle(expense.id, expense.is_active)}
                />
                <Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-400 hover:text-white" onClick={() => onEdit(expense)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-400 hover:text-red-400" onClick={() => handleDelete(expense.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
