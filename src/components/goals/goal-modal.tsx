'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useGoals } from '@/hooks/use-goals'
import { useToast } from '@/components/ui/use-toast'
import { CATEGORY_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import IconPicker from '@/components/categories/icon-picker'
import type { Goal } from '@/types'

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  target_amount: z.coerce.number().positive('Meta deve ser positiva'),
  current_amount: z.coerce.number().min(0),
  deadline: z.string().optional(),
  icon: z.string().min(1),
  color: z.string(),
  status: z.enum(['active', 'completed', 'cancelled']),
})

type FormData = z.infer<typeof schema>

interface GoalModalProps {
  open: boolean
  onClose: () => void
  editingGoal: Goal | null
}

export default function GoalModal({ open, onClose, editingGoal }: GoalModalProps) {
  const { addGoal, updateGoal } = useGoals()
  const { toast } = useToast()

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: {
        name: '', target_amount: 0, current_amount: 0,
        deadline: '', icon: '🎯', color: CATEGORY_COLORS[3], status: 'active',
      },
    })

  const selectedColor = watch('color')
  const selectedIcon = watch('icon')
  const selectedStatus = watch('status')

  useEffect(() => {
    if (editingGoal) {
      reset({
        name: editingGoal.name,
        target_amount: editingGoal.target_amount,
        current_amount: editingGoal.current_amount,
        deadline: editingGoal.deadline?.slice(0, 10) ?? '',
        icon: editingGoal.icon,
        color: editingGoal.color,
        status: editingGoal.status,
      })
    } else {
      reset({ name: '', target_amount: 0, current_amount: 0, deadline: '', icon: '🎯', color: CATEGORY_COLORS[3], status: 'active' })
    }
  }, [editingGoal, reset, open])

  async function onSubmit(data: FormData) {
    const payload = {
      name: data.name,
      target_amount: data.target_amount,
      current_amount: data.current_amount,
      deadline: data.deadline || null,
      icon: data.icon,
      color: data.color,
      status: data.status,
    }

    const { error } = editingGoal
      ? await updateGoal(editingGoal.id, payload)
      : await addGoal(payload)

    if (error) {
      toast({ title: 'Erro ao salvar meta', description: String(error), variant: 'destructive' })
    } else {
      toast({ title: editingGoal ? 'Meta atualizada!' : 'Meta criada!' })
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingGoal ? 'Editar Meta' : 'Nova Meta'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input {...register('name')} placeholder="Ex: Viagem para Europa" className="bg-zinc-800 border-zinc-700" />
            {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Valor da Meta</Label>
              <Input {...register('target_amount')} type="number" step="0.01" placeholder="0,00" className="bg-zinc-800 border-zinc-700" />
              {errors.target_amount && <p className="text-xs text-red-400">{errors.target_amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Valor Atual</Label>
              <Input {...register('current_amount')} type="number" step="0.01" placeholder="0,00" className="bg-zinc-800 border-zinc-700" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Prazo (opcional)</Label>
            <Input {...register('deadline')} type="date" className="bg-zinc-800 border-zinc-700" />
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={selectedStatus} onValueChange={(v) => setValue('status', v as FormData['status'])}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Ícone</Label>
            <IconPicker value={selectedIcon} onChange={(icon) => setValue('icon', icon)} />
          </div>

          <div className="space-y-1.5">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn('h-6 w-6 rounded-full transition-all', selectedColor === color && 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900')}
                  style={{ backgroundColor: color }}
                  onClick={() => setValue('color', color)}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" className="border-zinc-700" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-violet-600 hover:bg-violet-700">
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
