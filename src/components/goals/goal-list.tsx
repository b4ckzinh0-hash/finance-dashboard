'use client'

import { useState } from 'react'
import { Pencil, Trash2, Plus, Calendar } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { useGoals } from '@/hooks/use-goals'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import GoalProgress from './goal-progress'
import type { Goal } from '@/types'

const STATUS_LABELS: Record<Goal['status'], string> = {
  active: 'Ativa',
  completed: 'Concluída',
  cancelled: 'Cancelada',
}
const STATUS_COLORS: Record<Goal['status'], string> = {
  active: 'bg-violet-600',
  completed: 'bg-emerald-600',
  cancelled: 'bg-zinc-600',
}

interface GoalListProps {
  onEdit: (goal: Goal) => void
}

export default function GoalList({ onEdit }: GoalListProps) {
  const { goals, loading, deleteGoal, contributeToGoal } = useGoals()
  const { toast } = useToast()
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null)
  const [contributeAmount, setContributeAmount] = useState('')

  async function handleDelete(id: string) {
    const { error } = await deleteGoal(id)
    if (error) {
      toast({ title: 'Erro ao excluir meta', description: String(error), variant: 'destructive' })
    } else {
      toast({ title: 'Meta excluída' })
    }
  }

  async function handleContribute() {
    if (!contributeGoalId) return
    const amount = parseFloat(contributeAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Valor inválido', variant: 'destructive' })
      return
    }
    const { error } = await contributeToGoal(contributeGoalId, amount)
    if (error) {
      toast({ title: 'Erro ao contribuir', description: String(error), variant: 'destructive' })
    } else {
      toast({ title: 'Contribuição adicionada!' })
      setContributeGoalId(null)
      setContributeAmount('')
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-5 space-y-3">
              <Skeleton className="h-5 w-32 bg-zinc-800" />
              <Skeleton className="h-3 w-full bg-zinc-800" />
              <Skeleton className="h-4 w-24 bg-zinc-800" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 py-16 text-center">
        <p className="text-4xl mb-3">🎯</p>
        <p className="text-zinc-400">Nenhuma meta cadastrada.</p>
        <p className="text-sm text-zinc-500 mt-1">Clique em "Nova Meta" para começar.</p>
      </div>
    )
  }

  const daysUntil = (dateStr: string | null) => {
    if (!dateStr) return null
    const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
    return diff
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => {
          const days = daysUntil(goal.deadline)
          return (
            <Card key={goal.id} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{goal.icon}</span>
                    <div>
                      <p className="font-semibold text-white leading-tight">{goal.name}</p>
                      <Badge className={`${STATUS_COLORS[goal.status]} text-white text-xs mt-0.5`}>
                        {STATUS_LABELS[goal.status]}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-400 hover:text-white" onClick={() => onEdit(goal)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-400 hover:text-red-400" onClick={() => handleDelete(goal.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <GoalProgress
                  current={goal.current_amount}
                  target={goal.target_amount}
                  color={goal.color}
                  animated
                />

                <div className="flex justify-between text-xs text-zinc-400">
                  <span>{formatCurrency(goal.current_amount)}</span>
                  <span>{formatCurrency(goal.target_amount)}</span>
                </div>

                {goal.deadline && (
                  <div className="flex items-center gap-1 text-xs text-zinc-400">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(goal.deadline)}</span>
                    {days !== null && (
                      <span className={days < 0 ? 'text-red-400' : days <= 30 ? 'text-yellow-400' : 'text-zinc-400'}>
                        ({days < 0 ? `${Math.abs(days)} dias atrás` : `${days} dias restantes`})
                      </span>
                    )}
                  </div>
                )}

                {goal.status === 'active' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    onClick={() => setContributeGoalId(goal.id)}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Adicionar valor
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={!!contributeGoalId} onOpenChange={(v) => !v && setContributeGoalId(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle>Adicionar valor à meta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="number"
              step="0.01"
              placeholder="0,00"
              value={contributeAmount}
              onChange={(e) => setContributeAmount(e.target.value)}
              className="bg-zinc-800 border-zinc-700"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="border-zinc-700" onClick={() => setContributeGoalId(null)}>
                Cancelar
              </Button>
              <Button className="bg-violet-600 hover:bg-violet-700" onClick={handleContribute}>
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
