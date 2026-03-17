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
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { usePlanning } from '@/hooks/use-planning'
import { useCategories } from '@/hooks/use-categories'
import { useAccounts } from '@/hooks/use-accounts'
import { useToast } from '@/components/ui/use-toast'
import { FREQUENCY_OPTIONS } from '@/lib/constants'
import type { RecurringExpense } from '@/types'

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  amount: z.coerce.number().positive('Valor deve ser positivo'),
  category_id: z.string().min(1, 'Selecione uma categoria'),
  account_id: z.string().min(1, 'Selecione uma conta'),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  next_due_date: z.string().min(1, 'Data é obrigatória'),
  is_active: z.boolean(),
})

type FormData = z.infer<typeof schema>

interface BillModalProps {
  open: boolean
  onClose: () => void
  editingExpense: RecurringExpense | null
}

export default function BillModal({ open, onClose, editingExpense }: BillModalProps) {
  const { addRecurringExpense, updateRecurringExpense } = usePlanning()
  const { expenseCategories } = useCategories()
  const { accounts } = useAccounts()
  const { toast } = useToast()

  const today = new Date().toISOString().slice(0, 10)

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: {
        name: '', amount: 0, category_id: '', account_id: '',
        frequency: 'monthly', next_due_date: today, is_active: true,
      },
    })

  const isActive = watch('is_active')
  const frequency = watch('frequency')
  const categoryId = watch('category_id')
  const accountId = watch('account_id')

  useEffect(() => {
    if (editingExpense) {
      reset({
        name: editingExpense.name,
        amount: editingExpense.amount,
        category_id: editingExpense.category_id,
        account_id: editingExpense.account_id,
        frequency: editingExpense.frequency,
        next_due_date: editingExpense.next_due_date.slice(0, 10),
        is_active: editingExpense.is_active,
      })
    } else {
      reset({ name: '', amount: 0, category_id: '', account_id: '', frequency: 'monthly', next_due_date: today, is_active: true })
    }
  }, [editingExpense, reset, open, today])

  async function onSubmit(data: FormData) {
    const { error } = editingExpense
      ? await updateRecurringExpense(editingExpense.id, data)
      : await addRecurringExpense(data)

    if (error) {
      toast({ title: 'Erro ao salvar', description: String(error), variant: 'destructive' })
    } else {
      toast({ title: editingExpense ? 'Despesa atualizada!' : 'Despesa recorrente criada!' })
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>{editingExpense ? 'Editar Despesa Recorrente' : 'Nova Despesa Recorrente'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input {...register('name')} placeholder="Ex: Netflix" className="bg-zinc-800 border-zinc-700" />
            {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Valor</Label>
            <Input {...register('amount')} type="number" step="0.01" placeholder="0,00" className="bg-zinc-800 border-zinc-700" />
            {errors.amount && <p className="text-xs text-red-400">{errors.amount.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Categoria</Label>
            <Select value={categoryId} onValueChange={(v) => setValue('category_id', v)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {expenseCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category_id && <p className="text-xs text-red-400">{errors.category_id.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Conta</Label>
            <Select value={accountId} onValueChange={(v) => setValue('account_id', v)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.icon} {a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.account_id && <p className="text-xs text-red-400">{errors.account_id.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Frequência</Label>
            <Select value={frequency} onValueChange={(v) => setValue('frequency', v as FormData['frequency'])}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {FREQUENCY_OPTIONS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Próximo Vencimento</Label>
            <Input {...register('next_due_date')} type="date" className="bg-zinc-800 border-zinc-700" />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-zinc-700 p-3">
            <Label>Ativo</Label>
            <Switch checked={isActive} onCheckedChange={(v) => setValue('is_active', v)} />
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
