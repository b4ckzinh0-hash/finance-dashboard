'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTransactions } from '@/hooks/use-transactions'
import { useCategories } from '@/hooks/use-categories'
import { formatCurrency, getMonthName } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'

export default function ReportsPage() {
  const { transactions } = useTransactions()
  const { categories } = useCategories()

  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [selectedMonthYear, setSelectedMonthYear] = useState(now.getFullYear())
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())

  const monthlyData = useMemo(() => {
    const txs = transactions.filter((t) => {
      const d = new Date(t.date)
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedMonthYear
    })
    const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expenses = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

    const byDay = new Map<string, { income: number; expense: number }>()
    txs.forEach((t) => {
      const day = t.date.slice(0, 10)
      if (!byDay.has(day)) byDay.set(day, { income: 0, expense: 0 })
      const d = byDay.get(day)!
      if (t.type === 'income') d.income += t.amount
      else if (t.type === 'expense') d.expense += t.amount
    })

    const dayList = Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, v]) => ({ day: day.slice(8), ...v }))

    return { income, expenses, savings: income - expenses, transactions: txs, dayList }
  }, [transactions, selectedMonth, selectedMonthYear])

  const annualData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const txs = transactions.filter((t) => {
        const d = new Date(t.date)
        return d.getMonth() === i && d.getFullYear() === selectedYear
      })
      const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const expenses = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      return { month: getMonthName(i), income, expenses, savings: income - expenses }
    })
  }, [transactions, selectedYear])

  const categoryData = useMemo(() => {
    const txs = transactions.filter((t) => {
      const d = new Date(t.date)
      return t.type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    const total = txs.reduce((s, t) => s + t.amount, 0)
    return categories
      .filter((c) => c.type === 'expense')
      .map((cat) => {
        const amount = txs.filter((t) => t.category_id === cat.id).reduce((s, t) => s + t.amount, 0)
        return { name: cat.name, icon: cat.icon, color: cat.color, amount, pct: total > 0 ? (amount / total) * 100 : 0 }
      })
      .filter((c) => c.amount > 0)
      .sort((a, b) => b.amount - a.amount)
  }, [transactions, categories, now])

  const prevMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedMonthYear((y) => y - 1) }
    else setSelectedMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedMonthYear((y) => y + 1) }
    else setSelectedMonth((m) => m + 1)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <h1 className="text-2xl font-bold text-white">Relatórios</h1>

      <Tabs defaultValue="monthly">
        <TabsList className="bg-zinc-800">
          <TabsTrigger value="monthly">Mensal</TabsTrigger>
          <TabsTrigger value="annual">Anual</TabsTrigger>
          <TabsTrigger value="category">Por Categoria</TabsTrigger>
        </TabsList>

        {/* MONTHLY TAB */}
        <TabsContent value="monthly" className="space-y-4 mt-4">
          <div className="flex items-center gap-3">
            <Button size="icon" variant="outline" className="border-zinc-700" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-white font-medium w-36 text-center">
              {getMonthName(selectedMonth)} {selectedMonthYear}
            </span>
            <Button size="icon" variant="outline" className="border-zinc-700" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: 'Receitas', value: monthlyData.income, color: 'text-emerald-400' },
              { label: 'Despesas', value: monthlyData.expenses, color: 'text-red-400' },
              { label: 'Economia', value: monthlyData.savings, color: monthlyData.savings >= 0 ? 'text-violet-400' : 'text-red-400' },
            ].map((item) => (
              <Card key={item.label} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4 text-center">
                  <p className={`text-xl font-bold ${item.color}`}>{formatCurrency(item.value)}</p>
                  <p className="text-xs text-zinc-400 mt-1">{item.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {monthlyData.dayList.length > 0 && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-5">
                <h3 className="text-sm font-medium text-zinc-300 mb-4">Receitas e Despesas por Dia</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyData.dayList} margin={{ left: -20 }}>
                    <XAxis dataKey="day" tick={{ fill: '#71717a', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#71717a', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
                      labelStyle={{ color: '#fff' }}
                      formatter={(v: number) => formatCurrency(v)}
                    />
                    <Bar dataKey="income" name="Receitas" fill="#22C55E" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="expense" name="Despesas" fill="#EF4444" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ANNUAL TAB */}
        <TabsContent value="annual" className="space-y-4 mt-4">
          <div className="flex items-center gap-3">
            <Button size="icon" variant="outline" className="border-zinc-700" onClick={() => setSelectedYear((y) => y - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-white font-medium">{selectedYear}</span>
            <Button size="icon" variant="outline" className="border-zinc-700" onClick={() => setSelectedYear((y) => y + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-5">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={annualData} margin={{ left: -20 }}>
                  <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
                    labelStyle={{ color: '#fff' }}
                    formatter={(v: number) => formatCurrency(v)}
                  />
                  <Bar dataKey="income" name="Receitas" fill="#22C55E" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="expenses" name="Despesas" fill="#EF4444" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="text-left py-2 pr-4">Mês</th>
                    <th className="text-right py-2 pr-4">Receitas</th>
                    <th className="text-right py-2 pr-4">Despesas</th>
                    <th className="text-right py-2">Economia</th>
                  </tr>
                </thead>
                <tbody>
                  {annualData.map((row) => (
                    <tr key={row.month} className="border-b border-zinc-800/50">
                      <td className="py-2 pr-4 text-zinc-300">{row.month}</td>
                      <td className="py-2 pr-4 text-right text-emerald-400">{formatCurrency(row.income)}</td>
                      <td className="py-2 pr-4 text-right text-red-400">{formatCurrency(row.expenses)}</td>
                      <td className={`py-2 text-right font-medium ${row.savings >= 0 ? 'text-violet-400' : 'text-red-400'}`}>
                        {formatCurrency(row.savings)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CATEGORY TAB */}
        <TabsContent value="category" className="space-y-4 mt-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-5">
                <h3 className="text-sm font-medium text-zinc-300 mb-4">Gastos por Categoria (Mês Atual)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={categoryData} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, pct }) => `${name} ${pct.toFixed(0)}%`} labelLine={false}>
                      {categoryData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
                      formatter={(v: number) => formatCurrency(v)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-5 space-y-3">
                <h3 className="text-sm font-medium text-zinc-300 mb-2">Detalhamento</h3>
                {categoryData.length === 0 ? (
                  <p className="text-zinc-400 text-sm">Sem despesas este mês.</p>
                ) : (
                  categoryData.map((cat) => (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-zinc-200">
                          <span>{cat.icon}</span> {cat.name}
                        </span>
                        <span className="font-medium text-white">{formatCurrency(cat.amount)}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${cat.pct}%`, backgroundColor: cat.color }}
                        />
                      </div>
                      <p className="text-xs text-zinc-500 text-right">{cat.pct.toFixed(1)}%</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
