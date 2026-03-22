'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Plus, Pencil, Trash2, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

interface CreditCardItem {
  id: string
  user_id: string
  name: string
  limit_amount: number
  closing_day: number
  due_day: number
  color: string
  icon: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Installment {
  id: string
  transaction_id: string
  credit_card_id: string
  installment_amount: number
  total_installments: number
  current_installment: number
  transaction?: { date: string }
}

const CARD_COLORS = [
  '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#06b6d4', '#6366f1',
]

function getCardGradient(color: string) {
  return `linear-gradient(135deg, ${color}cc 0%, ${color}66 100%)`
}

function getBillingPeriod(closingDay: number) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const day = now.getDate()

  let start: Date
  let end: Date

  if (day <= closingDay) {
    // Current cycle: closing_day of previous month → closing_day of current month
    const prevMonth = month === 0 ? 11 : month - 1
    const prevYear = month === 0 ? year - 1 : year
    start = new Date(prevYear, prevMonth, closingDay + 1)
    end = new Date(year, month, closingDay)
  } else {
    // Current cycle: closing_day of current month → closing_day of next month
    const nextMonth = month === 11 ? 0 : month + 1
    const nextYear = month === 11 ? year + 1 : year
    start = new Date(year, month, closingDay + 1)
    end = new Date(nextYear, nextMonth, closingDay)
  }

  const toDateStr = (d: Date) => d.toISOString().split('T')[0]
  return { start: toDateStr(start), end: toDateStr(end) }
}

export default function CreditCardsPage() {
  const supabase = useRef(createClient()).current
  const { toast } = useToast()

  const [cards, setCards] = useState<CreditCardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [installments, setInstallments] = useState<Installment[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<CreditCardItem | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formLimit, setFormLimit] = useState('')
  const [formClosingDay, setFormClosingDay] = useState('10')
  const [formDueDay, setFormDueDay] = useState('20')
  const [formColor, setFormColor] = useState(CARD_COLORS[0])

  const fetchCards = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (error) {
      toast({ title: 'Erro ao carregar cartões', variant: 'destructive' })
    } else {
      setCards((data as CreditCardItem[]) ?? [])
    }
    setLoading(false)
  }, [supabase, toast])

  const fetchInstallments = useCallback(async () => {
    const { data } = await supabase
      .from('installments')
      .select('*, transaction:transactions(date)')
    setInstallments((data as Installment[]) ?? [])
  }, [supabase])

  useEffect(() => {
    fetchCards()
    fetchInstallments()
  }, [fetchCards, fetchInstallments])

  const getCardInvoice = (card: CreditCardItem) => {
    const { start, end } = getBillingPeriod(card.closing_day)
    return installments
      .filter(inst =>
        inst.credit_card_id === card.id &&
        inst.transaction?.date &&
        inst.transaction.date >= start &&
        inst.transaction.date <= end
      )
      .reduce((sum, inst) => sum + inst.installment_amount, 0)
  }

  const handleOpenAdd = () => {
    setEditingCard(null)
    setFormName('')
    setFormLimit('')
    setFormClosingDay('10')
    setFormDueDay('20')
    setFormColor(CARD_COLORS[0])
    setModalOpen(true)
  }

  const handleOpenEdit = (card: CreditCardItem) => {
    setEditingCard(card)
    setFormName(card.name)
    setFormLimit(String(card.limit_amount))
    setFormClosingDay(String(card.closing_day))
    setFormDueDay(String(card.due_day))
    setFormColor(card.color)
    setModalOpen(true)
  }

  const handleSave = async () => {
    const limit = parseFloat(formLimit)
    const closingDay = parseInt(formClosingDay)
    const dueDay = parseInt(formDueDay)
    if (!formName.trim() || isNaN(limit) || limit <= 0 || isNaN(closingDay) || isNaN(dueDay)) {
      toast({ title: 'Preencha todos os campos corretamente', variant: 'destructive' })
      return
    }
    setSaving(true)
    const payload = {
      name: formName.trim(),
      limit_amount: limit,
      closing_day: closingDay,
      due_day: dueDay,
      color: formColor,
    }
    if (editingCard) {
      const { error } = await supabase.from('credit_cards').update(payload).eq('id', editingCard.id)
      if (error) {
        toast({ title: 'Erro ao atualizar cartão', variant: 'destructive' })
      } else {
        toast({ title: 'Cartão atualizado!' })
        setModalOpen(false)
        fetchCards()
      }
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setSaving(false); return }
      const { error } = await supabase.from('credit_cards').insert({ ...payload, user_id: user.id, is_active: true })
      if (error) {
        toast({ title: 'Erro ao adicionar cartão', variant: 'destructive' })
      } else {
        toast({ title: 'Cartão adicionado!' })
        setModalOpen(false)
        fetchCards()
      }
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('credit_cards').update({ is_active: false }).eq('id', id)
    if (error) {
      toast({ title: 'Erro ao remover cartão', variant: 'destructive' })
    } else {
      toast({ title: 'Cartão removido' })
      fetchCards()
    }
  }

  const totalLimit = cards.reduce((s, c) => s + c.limit_amount, 0)
  const totalInvoice = cards.reduce((s, c) => s + getCardInvoice(c), 0)
  const totalAvailable = totalLimit - totalInvoice

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
          <div className="p-2 rounded-lg bg-violet-500/10">
            <CreditCard className="h-6 w-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Cartões de Crédito</h1>
            <p className="text-sm text-zinc-400">Gerencie seus cartões e faturas</p>
          </div>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={handleOpenAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Cartão
        </Button>
      </div>

      {/* Summary cards */}
      {!loading && cards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Limite Total', value: formatCurrency(totalLimit), color: 'text-white' },
            { label: 'Fatura Total', value: formatCurrency(totalInvoice), color: 'text-red-400' },
            { label: 'Disponível', value: formatCurrency(totalAvailable), color: 'text-emerald-400' },
          ].map(item => (
            <Card key={item.label} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4">
                <p className="text-xs text-zinc-400 uppercase tracking-wide">{item.label}</p>
                <p className={`text-2xl font-bold mt-1 ${item.color}`}>{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Cards list */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 bg-zinc-800 rounded-2xl" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-3">
            <Wallet className="h-12 w-12 text-zinc-600" />
            <p className="text-zinc-400 text-center">Nenhum cartão de crédito cadastrado</p>
            <Button variant="outline" className="border-zinc-700 text-zinc-300" onClick={handleOpenAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar cartão
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card, i) => {
            const invoice = getCardInvoice(card)
            const available = card.limit_amount - invoice
            const usagePct = card.limit_amount > 0 ? Math.min((invoice / card.limit_amount) * 100, 100) : 0
            const progressColor = usagePct >= 90 ? 'bg-red-500' : usagePct >= 75 ? 'bg-yellow-500' : 'bg-emerald-500'

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                {/* Visual Card */}
                <div
                  className="relative rounded-2xl p-5 mb-3 overflow-hidden text-white shadow-lg"
                  style={{ background: getCardGradient(card.color), minHeight: 160 }}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="text-xs opacity-70 uppercase tracking-widest">Crédito</p>
                      <p className="text-lg font-bold mt-0.5">{card.name}</p>
                    </div>
                    <CreditCard className="h-8 w-8 opacity-60" />
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs opacity-70">Fatura atual</p>
                      <p className="text-xl font-bold">{formatCurrency(invoice)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs opacity-70">Venc. dia</p>
                      <p className="text-lg font-semibold">{card.due_day}</p>
                    </div>
                  </div>
                  {/* Decorative circles */}
                  <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 bg-white" />
                  <div className="absolute -right-2 top-10 w-16 h-16 rounded-full opacity-10 bg-white" />
                </div>

                {/* Card details */}
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="p-4 space-y-3">
                    {/* Usage bar */}
                    <div>
                      <div className="flex justify-between text-xs text-zinc-400 mb-1">
                        <span>Uso do limite</span>
                        <span>{usagePct.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${progressColor}`}
                          style={{ width: `${usagePct}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>Limite: {formatCurrency(card.limit_amount)}</span>
                      <span className="text-emerald-400">Disponível: {formatCurrency(available)}</span>
                    </div>
                    <div className="text-xs text-zinc-400">
                      Fechamento: dia {card.closing_day} &nbsp;|&nbsp; Vencimento: dia {card.due_day}
                    </div>
                    <div className="flex justify-end gap-1 pt-1">
                      <Button size="sm" variant="ghost" className="h-7 text-zinc-400 hover:text-white" onClick={() => handleOpenEdit(card)}>
                        <Pencil className="h-3 w-3 mr-1" /> Editar
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-zinc-400 hover:text-red-400" onClick={() => handleDelete(card.id)}>
                        <Trash2 className="h-3 w-3 mr-1" /> Remover
                      </Button>
                    </div>
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
            <DialogTitle>{editingCard ? 'Editar Cartão' : 'Novo Cartão'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-zinc-300">Nome do cartão</Label>
              <Input
                placeholder="Ex: Nubank, Itaú Visa..."
                value={formName}
                onChange={e => setFormName(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Limite (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={formLimit}
                onChange={e => setFormLimit(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-zinc-300">Dia de fechamento</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={formClosingDay}
                  onChange={e => setFormClosingDay(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Dia de vencimento</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={formDueDay}
                  onChange={e => setFormDueDay(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Cor</Label>
              <div className="flex gap-2 flex-wrap">
                {CARD_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setFormColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${formColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                    aria-label={c}
                  />
                ))}
              </div>
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
                {saving ? 'Salvando…' : editingCard ? 'Salvar' : 'Adicionar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
