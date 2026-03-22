'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import { useTransactionsContext } from '@/contexts/data-provider'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import type { Transaction, RecurringExpense } from '@/types'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

interface DayData {
  date: number
  income: Transaction[]
  expense: Transaction[]
  recurring: RecurringExpense[]
}

export default function CalendarPage() {
  const supabase = useRef(createClient()).current
  const { transactions, loading: txLoading } = useTransactionsContext()
  const { toast } = useToast()

  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth()) // 0-indexed
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([])
  const [recurringLoading, setRecurringLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const fetchRecurring = useCallback(async () => {
    setRecurringLoading(true)
    const { data, error } = await supabase
      .from('recurring_expenses')
      .select('*, category:categories(*)')
      .eq('is_active', true)
    if (error) {
      toast({ title: 'Erro ao carregar despesas recorrentes', variant: 'destructive' })
    } else {
      setRecurringExpenses((data as RecurringExpense[]) ?? [])
    }
    setRecurringLoading(false)
  }, [supabase, toast])

  useEffect(() => { fetchRecurring() }, [fetchRecurring])

  const pad = (n: number) => String(n).padStart(2, '0')
  const monthStr = `${viewYear}-${pad(viewMonth + 1)}`

  // Filter transactions for current view month
  const monthTransactions = transactions.filter(t => t.date.startsWith(monthStr))

  // Recurring expenses that fall in this month (by due_day)
  const recurringInMonth = recurringExpenses.filter(r => {
    const nextDue = new Date(r.next_due_date + 'T00:00:00')
    return nextDue.getFullYear() === viewYear && nextDue.getMonth() === viewMonth
  })

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay() // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const getDayData = (day: number): DayData => {
    const dateStr = `${monthStr}-${pad(day)}`
    const income = monthTransactions.filter(t => t.type === 'income' && t.date === dateStr)
    const expense = monthTransactions.filter(t => t.type === 'expense' && t.date === dateStr)
    const recurring = recurringInMonth.filter(r => {
      const d = new Date(r.next_due_date + 'T00:00:00').getDate()
      return d === day
    })
    return { date: day, income, expense, recurring }
  }

  // Month summary
  const totalIncome = monthTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = monthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalExpense

  const navigatePrev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
    setSelectedDay(null)
  }
  const navigateNext = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
    setSelectedDay(null)
  }

  const isLoading = txLoading || recurringLoading
  const selectedDayData = selectedDay !== null ? getDayData(selectedDay) : null
  const isToday = (day: number) =>
    day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-orange-500/10">
          <CalendarDays className="h-6 w-6 text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Calendário Financeiro</h1>
          <p className="text-sm text-zinc-400">Visualize suas finanças no calendário</p>
        </div>
      </div>

      {/* Month navigation + summary */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-800" onClick={navigatePrev}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold text-white">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h2>
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-800" onClick={navigateNext}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          {isLoading ? (
            <div className="flex gap-4 justify-center">
              <Skeleton className="h-4 w-28 bg-zinc-800" />
              <Skeleton className="h-4 w-28 bg-zinc-800" />
              <Skeleton className="h-4 w-28 bg-zinc-800" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div>
                <p className="text-zinc-400 text-xs">Receitas</p>
                <p className="text-emerald-400 font-semibold">{formatCurrency(totalIncome)}</p>
              </div>
              <div>
                <p className="text-zinc-400 text-xs">Despesas</p>
                <p className="text-red-400 font-semibold">{formatCurrency(totalExpense)}</p>
              </div>
              <div>
                <p className="text-zinc-400 text-xs">Saldo</p>
                <p className={`font-semibold ${balance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>{formatCurrency(balance)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Calendar grid */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-2">
            {WEEKDAYS.map(d => (
              <div key={d} className="text-center text-xs font-medium text-zinc-500 py-1">{d}</div>
            ))}
          </div>
          {/* Days */}
          {isLoading ? (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="h-14 bg-zinc-800 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells before first day */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {/* Day cells */}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const { income, expense, recurring } = getDayData(day)
                const hasData = income.length > 0 || expense.length > 0 || recurring.length > 0
                const isSelected = selectedDay === day
                const isTodayDay = isToday(day)

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`
                      relative rounded-lg p-1 min-h-14 flex flex-col items-center transition-all
                      ${isSelected ? 'bg-violet-600/30 border border-violet-500' : 'hover:bg-zinc-800 border border-transparent'}
                      ${isTodayDay ? 'ring-1 ring-violet-500' : ''}
                    `}
                  >
                    <span className={`text-sm font-medium mb-1 ${isTodayDay ? 'text-violet-400' : 'text-zinc-300'}`}>
                      {day}
                    </span>
                    {hasData && (
                      <div className="flex gap-0.5 flex-wrap justify-center">
                        {income.length > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" title="Receita" />
                        )}
                        {expense.length > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" title="Despesa" />
                        )}
                        {recurring.length > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" title="Recorrente" />
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Legend */}
          <div className="flex gap-4 mt-4 justify-center text-xs text-zinc-400">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Receita</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Despesa</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Recorrente</span>
          </div>
        </CardContent>
      </Card>

      {/* Day detail panel */}
      <AnimatePresence>
        {selectedDayData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">
                    {selectedDayData.date} de {MONTH_NAMES[viewMonth]}
                  </h3>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-white" onClick={() => setSelectedDay(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {selectedDayData.income.length === 0 && selectedDayData.expense.length === 0 && selectedDayData.recurring.length === 0 ? (
                  <p className="text-zinc-500 text-sm text-center py-4">Nenhuma movimentação neste dia</p>
                ) : (
                  <div className="space-y-4">
                    {selectedDayData.income.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-2">Receitas</p>
                        {selectedDayData.income.map(t => (
                          <div key={t.id} className="flex items-center justify-between py-1.5 border-b border-zinc-800 last:border-0">
                            <span className="text-zinc-300 text-sm">{t.description}</span>
                            <span className="text-emerald-400 text-sm font-medium">+{formatCurrency(t.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedDayData.expense.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2">Despesas</p>
                        {selectedDayData.expense.map(t => (
                          <div key={t.id} className="flex items-center justify-between py-1.5 border-b border-zinc-800 last:border-0">
                            <span className="text-zinc-300 text-sm">{t.description}</span>
                            <span className="text-red-400 text-sm font-medium">-{formatCurrency(t.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedDayData.recurring.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wide mb-2">Vencimentos Recorrentes</p>
                        {selectedDayData.recurring.map(r => (
                          <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-zinc-800 last:border-0">
                            <span className="text-zinc-300 text-sm">{r.name}</span>
                            <span className="text-yellow-400 text-sm font-medium">{formatCurrency(r.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
