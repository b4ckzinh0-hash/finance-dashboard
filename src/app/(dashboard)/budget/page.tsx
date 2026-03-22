'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { PiggyBank, Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import { useTransactionsContext, useCategoriesContext } from '@/contexts/data-provider'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import type { Category } from '@/types'

interface Budget {
  id: string
  user_id: string
  category_id: string
  amount: number
  month: number
  year: number
  rollover: boolean
  category?: Category
}

export default function BudgetPage() {
  const supabase = useRef(createClient()).current
  const { transactions, loading: txLoading } = useTransactionsContext()
  const { categories, loading: catLoading } = useCategoriesContext()
  const { toast } = useToast()

  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [formCategoryId, setFormCategoryId] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [saving, setSaving] = useState(false)

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const fetchBudgets = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('budgets')
      .select('*, category:categories(*)')
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .order('created_at', { ascending: false })
    if (error) {
      toast({ title: 'Erro ao carregar orçamentos', variant: 'destructive' })
    } else {
      setBudgets((data as Budget[]) ?? [])
    }
    setLoading(false)
  }, [supabase, currentMonth, currentYear, toast])

  useEffect(() => { fetchBudgets() }, [fetchBudgets])

  const getSpentForCategory = (categoryId: string) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    const from = `${currentYear}-${pad(currentMonth)}-01`
    const lastDay = new Date(currentYear, currentMonth, 0).getDate()
    const to = `${currentYear}-${pad(currentMonth)}-${pad(lastDay)}`
    return transactions
      .filter(t => t.type === 'expense' && t.category_id === categoryId && t.date >= from && t.date <= to)
      .reduce((sum, t) => sum + t.amount, 0)
  }

  const expenseCategories = categories.filter(c => c.type === 'expense')

  const handleOpenAdd = () => {
    setEditingBudget(null)
    setFormCategoryId('')
    setFormAmount('')
    setModalOpen(true)
  }

  const handleOpenEdit = (budget: Budget) => {
    setEditingBudget(budget)
    setFormCategoryId(budget.category_id)
    setFormAmount(String(budget.amount))
    setModalOpen(true)
  }

  const handleSave = async () => {
    const amount = parseFloat(formAmount)
    if (!formCategoryId || isNaN(amount) || amount <= 0) {
      toast({ title: 'Preencha todos os campos corretamente', variant: 'destructive' })
      return
    }
    setSaving(true)
    if (editingBudget) {
      const { error } = await supabase
        .from('budgets')
        .update({ category_id: formCategoryId, amount })
        .eq('id', editingBudget.id)
      if (error) {
        toast({ title: 'Erro ao atualizar orçamento', variant: 'destructive' })
      } else {
        toast({ title: 'Orçamento atualizado!' })
        setModalOpen(false)
        fetchBudgets()
      }
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setSaving(false); return }
      const { error } = await supabase.from('budgets').insert({
        user_id: user.id,
        category_id: formCategoryId,
        amount,
        month: currentMonth,
        year: currentYear,
        rollover: false,
      })
      if (error) {
        if (error.code === '23505') {
          toast({ title: 'Já existe um orçamento para esta categoria neste mês', variant: 'destructive' })
        } else {
          toast({ title: 'Erro ao criar orçamento', variant: 'destructive' })
        }
      } else {
        toast({ title: 'Orçamento criado!' })
        setModalOpen(false)
        fetchBudgets()
      }
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('budgets').delete().eq('id', id)
    if (error) {
      toast({ title: 'Erro ao excluir orçamento', variant: 'destructive' })
    } else {
      toast({ title: 'Orçamento excluído' })
      fetchBudgets()
    }
  }

  const isLoading = loading || txLoading || catLoading

  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0)
  const totalSpent = budgets.reduce((s, b) => s + getSpentForCategory(b.category_id), 0)
  const totalRemaining = totalBudgeted - totalSpent

  const getProgressColor = (pct: number) => {
    if (pct >= 90) return 'bg-red-500'
    if (pct >= 75) return 'bg-yellow-500'
    return 'bg-emerald-500'
  }

  const monthName = now.toLocaleString('pt-BR', { month: 'long' })
  const monthTitle = monthName.charAt(0).toUpperCase() + monthName.slice(1)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <PiggyBank className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Orçamento</h1>
            <p className="text-sm text-zinc-400">{monthTitle} {currentYear}</p>
          </div>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={handleOpenAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Orçamento
        </Button>
      </div>

      {/* Summary cards */}
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Orçado', value: formatCurrency(totalBudgeted), color: 'text-white' },
            { label: 'Total Gasto', value: formatCurrency(totalSpent), color: 'text-red-400' },
            { label: 'Saldo Restante', value: formatCurrency(totalRemaining), color: totalRemaining >= 0 ? 'text-emerald-400' : 'text-red-400' },
          ].map(card => (
            <Card key={card.label} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <p className="text-xs text-zinc-400 uppercase tracking-wide">{card.label}</p>
                <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Budget list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-4 w-32 bg-zinc-800" />
                <Skeleton className="h-2 w-full bg-zinc-800" />
                <Skeleton className="h-3 w-24 bg-zinc-800" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : budgets.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-3">
            <PiggyBank className="h-12 w-12 text-zinc-600" />
            <p className="text-zinc-400 text-center">Nenhum orçamento definido para este mês</p>
            <Button variant="outline" className="border-zinc-700 text-zinc-300" onClick={handleOpenAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Criar orçamento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {budgets.map((budget, i) => {
            const spent = getSpentForCategory(budget.category_id)
            const pct = budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0
            const remaining = budget.amount - spent
            const progressColor = getProgressColor(pct)
            const cat = budget.category ?? categories.find(c => c.id === budget.category_id)

            return (
              <motion.div
                key={budget.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {cat?.icon && <span className="text-lg">{cat.icon}</span>}
                        <span className="font-medium text-white">{cat?.name ?? 'Categoria'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`text-sm font-semibold mr-1 ${pct >= 90 ? 'text-red-400' : pct >= 75 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                          {pct.toFixed(0)}%
                        </span>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-400 hover:text-white" onClick={() => handleOpenEdit(budget)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-400 hover:text-red-400" onClick={() => handleDelete(budget.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-800 mb-2">
                      <div
                        className={`h-full rounded-full transition-all ${progressColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>Gasto: {formatCurrency(spent)}</span>
                      <span>Limite: {formatCurrency(budget.amount)}</span>
                    </div>
                    {remaining < 0 && (
                      <p className="text-xs text-red-400 mt-1">
                        ⚠️ Limite ultrapassado em {formatCurrency(Math.abs(remaining))}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>{editingBudget ? 'Editar Orçamento' : 'Novo Orçamento'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-zinc-300">Categoria</Label>
              <Select value={formCategoryId} onValueChange={setFormCategoryId}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {expenseCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id} className="text-white hover:bg-zinc-700">
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Limite (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={formAmount}
                onChange={e => setFormAmount(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" className="border-zinc-700 text-zinc-300" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="bg-violet-600 hover:bg-violet-700 text-white"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Salvando…' : editingBudget ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
