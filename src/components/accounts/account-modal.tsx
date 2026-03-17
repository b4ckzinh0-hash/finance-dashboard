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
import { useAccounts } from '@/hooks/use-accounts'
import { useToast } from '@/components/ui/use-toast'
import { ACCOUNT_TYPES, CATEGORY_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Account } from '@/types'

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['checking', 'savings', 'credit_card', 'investment', 'cash', 'other']),
  balance: z.coerce.number(),
  color: z.string(),
  icon: z.string().min(1, 'Ícone é obrigatório'),
  is_active: z.boolean().default(true),
})

type FormData = z.infer<typeof schema>

interface AccountModalProps {
  open: boolean
  onClose: () => void
  editingAccount: Account | null
}

export default function AccountModal({ open, onClose, editingAccount }: AccountModalProps) {
  const { addAccount, updateAccount } = useAccounts()
  const { toast } = useToast()

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: {
        name: '',
        type: 'checking',
        balance: 0,
        color: CATEGORY_COLORS[0],
        icon: '🏦',
        is_active: true,
      },
    })

  const selectedColor = watch('color')
  const selectedType = watch('type')

  useEffect(() => {
    if (editingAccount) {
      reset({
        name: editingAccount.name,
        type: editingAccount.type,
        balance: editingAccount.balance,
        color: editingAccount.color,
        icon: editingAccount.icon,
        is_active: editingAccount.is_active,
      })
    } else {
      reset({
        name: '',
        type: 'checking',
        balance: 0,
        color: CATEGORY_COLORS[0],
        icon: '🏦',
        is_active: true,
      })
    }
  }, [editingAccount, reset, open])

  async function onSubmit(data: FormData) {
    const payload = {
      name: data.name,
      type: data.type,
      balance: data.balance,
      color: data.color,
      icon: data.icon,
      is_active: data.is_active,
    }

    const { error } = editingAccount
      ? await updateAccount(editingAccount.id, payload)
      : await addAccount(payload)

    if (error) {
      toast({ title: 'Erro ao salvar conta', description: String(error), variant: 'destructive' })
    } else {
      toast({ title: editingAccount ? 'Conta atualizada!' : 'Conta criada!' })
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>{editingAccount ? 'Editar Conta' : 'Nova Conta'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <Input
              {...register('name')}
              placeholder="Ex: Nubank"
              className="bg-zinc-800 border-zinc-700"
            />
            {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Select
              value={selectedType}
              onValueChange={(v) => setValue('type', v as FormData['type'])}
            >
              <SelectTrigger className="bg-zinc-800 border-zinc-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {ACCOUNT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.icon} {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{editingAccount ? 'Saldo atual' : 'Saldo inicial'}</Label>
            <Input
              {...register('balance')}
              type="number"
              step="0.01"
              placeholder="0,00"
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Ícone (emoji)</Label>
            <Input
              {...register('icon')}
              placeholder="🏦"
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.slice(0, 6).map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    'h-7 w-7 rounded-full transition-all',
                    selectedColor === color && 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900',
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => setValue('color', color)}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" className="border-zinc-700" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-violet-600 hover:bg-violet-700">
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
