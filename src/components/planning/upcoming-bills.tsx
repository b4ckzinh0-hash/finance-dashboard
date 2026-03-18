'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { usePlanning } from '@/hooks/use-planning'
import { useTransactions } from '@/hooks/use-transactions'
import { useAccounts } from '@/hooks/use-accounts'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Check, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UpcomingBillsProps {
  onMarkPaid: () => void
}

export default function UpcomingBills({ onMarkPaid }: UpcomingBillsProps) {
  const { recurringExpenses, loading } = usePlanning()
  const { addTransaction } = useTransactions()
  const { accounts } = useAccounts()
  const { toast } = useToast()

  const today = new Date()
  const in30Days = new Date(today.getTime() + 30 * 86400000)

  const upcoming = recurringExpenses.filter((e) => {
    if (!e.is_active) return false
    const due = new Date(e.next_due_date)
    return due >= today && due <= in30Days
  }).sort((a, b) => new Date(a.next_due_date).getTime() - new Date(b.next_due_date).getTime())

  async function handleMarkPaid(expense: typeof upcoming[0]) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _account = accounts.find((a) => a.id === expense.account_id)
    const { error } = await addTransaction({
      account_id: expense.account_id,
      category_id: expense.category_id,
      type: 'expense',
      amount: expense.amount,
      description: expense.name,
      date: new Date().toISOString().slice(0, 10),
      payment_method: 'bank_transfer',
      notes: 'Marcado como pago automaticamente',
      is_recurring: true,
      recurring_id: expense.id,
    })
    if (error) {
      toast({ title: 'Erro ao marcar como pago', description: String(error), variant: 'destructive' })
    } else {
      toast({ title: `"${expense.name}" marcado como pago!` })
      onMarkPaid()
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="bg-zinc-900 border-zinc-800">
            <CardContent className="flex items-center justify-between p-4">
              <Skeleton className="h-4 w-40 bg-zinc-800" />
              <Skeleton className="h-8 w-24 bg-zinc-800" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (upcoming.length === 0) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-6 text-center text-zinc-400">
          Nenhum vencimento nos próximos 30 dias 🎉
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {upcoming.map((expense) => {
        const days = Math.ceil((new Date(expense.next_due_date).getTime() - today.getTime()) / 86400000)
        const urgency = days <= 3 ? 'red' : days <= 7 ? 'yellow' : 'green'
        return (
          <Card key={expense.id} className={cn(
            'border',
            urgency === 'red' ? 'border-red-800 bg-red-950/30' :
            urgency === 'yellow' ? 'border-yellow-800 bg-yellow-950/20' :
            'border-zinc-800 bg-zinc-900',
          )}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold',
                  urgency === 'red' ? 'bg-red-900 text-red-300' :
                  urgency === 'yellow' ? 'bg-yellow-900 text-yellow-300' :
                  'bg-zinc-800 text-zinc-300',
                )}>
                  {days}d
                </div>
                <div>
                  <p className="font-medium text-white">{expense.name}</p>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(expense.next_due_date)}</span>
                    <span>•</span>
                    <span className={cn(
                      urgency === 'red' ? 'text-red-400' :
                      urgency === 'yellow' ? 'text-yellow-400' :
                      'text-emerald-400',
                    )}>
                      {days === 0 ? 'Vence hoje' : `${days} dia${days > 1 ? 's' : ''}`}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-white">{formatCurrency(expense.amount)}</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-zinc-700 text-zinc-300 hover:bg-emerald-900 hover:text-emerald-300 hover:border-emerald-700"
                  onClick={() => handleMarkPaid(expense)}
                >
                  <Check className="mr-1 h-3.5 w-3.5" />
                  Pago
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
