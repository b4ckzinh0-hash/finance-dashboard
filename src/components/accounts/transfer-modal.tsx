'use client'

import { useEffect, useMemo } from 'react'
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

const schema = z.object({
  from_account_id: z.string().min(1, 'Selecione a conta de origem'),
  to_account_id: z.string().min(1, 'Selecione a conta de destino'),
  amount: z.coerce.number().positive('Valor deve ser positivo'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  date: z.string().min(1, 'Data é obrigatória'),
})

type FormData = z.infer<typeof schema>

interface TransferModalProps {
  open: boolean
  onClose: () => void
}

export default function TransferModal({ open, onClose }: TransferModalProps) {
  const { accounts, transferBetweenAccounts } = useAccounts()
  const { toast } = useToast()

  const today = new Date().toISOString().slice(0, 10)

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { from_account_id: '', to_account_id: '', amount: 0, description: 'Transferência', date: today },
    })

  useEffect(() => {
    if (open) reset({ from_account_id: '', to_account_id: '', amount: 0, description: 'Transferência', date: today })
  }, [open, reset, today])

  const fromId = watch('from_account_id')
  const toId = watch('to_account_id')

  const toAccounts = useMemo(() => accounts.filter((a) => a.id !== fromId), [accounts, fromId])
  const fromAccounts = useMemo(() => accounts.filter((a) => a.id !== toId), [accounts, toId])

  async function onSubmit(data: FormData) {
    if (data.from_account_id === data.to_account_id) {
      toast({ title: 'Erro', description: 'Contas de origem e destino devem ser diferentes.', variant: 'destructive' })
      return
    }
    const { error } = await transferBetweenAccounts(
      data.from_account_id,
      data.to_account_id,
      data.amount,
      data.description,
      data.date,
    )
    if (error) {
      toast({ title: 'Erro ao realizar transferência', description: String(error), variant: 'destructive' })
    } else {
      toast({ title: 'Transferência realizada com sucesso!' })
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Transferência entre Contas</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Conta de Origem</Label>
            <Select value={fromId} onValueChange={(v) => setValue('from_account_id', v)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {fromAccounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.icon} {a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.from_account_id && <p className="text-xs text-red-400">{errors.from_account_id.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Conta de Destino</Label>
            <Select value={toId} onValueChange={(v) => setValue('to_account_id', v)}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {toAccounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.icon} {a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.to_account_id && <p className="text-xs text-red-400">{errors.to_account_id.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Valor</Label>
            <Input
              {...register('amount')}
              type="number"
              step="0.01"
              placeholder="0,00"
              className="bg-zinc-800 border-zinc-700"
            />
            {errors.amount && <p className="text-xs text-red-400">{errors.amount.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Input
              {...register('description')}
              placeholder="Transferência"
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Data</Label>
            <Input
              {...register('date')}
              type="date"
              className="bg-zinc-800 border-zinc-700"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" className="border-zinc-700" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-violet-600 hover:bg-violet-700">
              {isSubmitting ? 'Transferindo...' : 'Transferir'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
