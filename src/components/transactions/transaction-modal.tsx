"use client"

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, parseISO, isValid } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTransactions } from '@/hooks/use-transactions'
import { useAccounts } from '@/hooks/use-accounts'
import { useCategories } from '@/hooks/use-categories'
import { useToast } from '@/components/ui/use-toast'
import { PAYMENT_METHODS } from '@/lib/constants'
import type { TransactionType } from '@/types'

// ─── Validation schema ───────────────────────────────────────────────────────

const modalSchema = z
  .object({
    type: z.enum(['income', 'expense', 'transfer']),
    amount: z
      .number({ invalid_type_error: 'Informe um valor' })
      .positive('O valor deve ser positivo'),
    description: z.string().min(1, 'Descrição obrigatória'),
    date: z.string().min(1, 'Data obrigatória'),
    account_id: z.string().min(1, 'Conta obrigatória'),
    to_account_id: z.string().optional(),
    category_id: z.string().optional(),
    payment_method: z
      .enum(['pix', 'credit_card', 'debit_card', 'cash', 'bank_transfer', 'boleto', 'other'])
      .optional(),
    notes: z.string().optional(),
    is_recurring: z.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'transfer') {
      if (!data.to_account_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Conta de destino obrigatória',
          path: ['to_account_id'],
        })
      }
      if (data.to_account_id && data.to_account_id === data.account_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Conta de destino deve ser diferente da conta de origem',
          path: ['to_account_id'],
        })
      }
    } else {
      if (!data.category_id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Categoria obrigatória',
          path: ['category_id'],
        })
      }
      if (!data.payment_method) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Método de pagamento obrigatório',
          path: ['payment_method'],
        })
      }
    }
  })

type ModalFormValues = z.infer<typeof modalSchema>

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateForInput(dateStr: string): string {
  try {
    const parsed = parseISO(dateStr)
    if (isValid(parsed)) return format(parsed, 'yyyy-MM-dd')
  } catch {
    // fall through
  }
  return dateStr.slice(0, 10)
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface TransactionModalProps {
  open: boolean
  onClose: () => void
  editingId: string | null
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TransactionModal({ open, onClose, editingId }: TransactionModalProps) {
  const { transactions, addTransaction, updateTransaction } = useTransactions()
  const { accounts, transferBetweenAccounts } = useAccounts()
  const { expenseCategories, incomeCategories } = useCategories()
  const { toast } = useToast()

  const isEditing = Boolean(editingId)
  const editingTransaction = editingId ? transactions.find((t) => t.id === editingId) : null

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ModalFormValues>({
    resolver: zodResolver(modalSchema),
    defaultValues: {
      type: 'expense',
      date: format(new Date(), 'yyyy-MM-dd'),
      is_recurring: false,
    },
  })

  const transactionType = watch('type')
  const filteredCategories =
    transactionType === 'income' ? incomeCategories : expenseCategories

  // Populate form when editing
  useEffect(() => {
    if (open && editingTransaction) {
      reset({
        type: editingTransaction.type,
        amount: editingTransaction.amount,
        description: editingTransaction.description,
        date: formatDateForInput(editingTransaction.date),
        account_id: editingTransaction.account_id,
        category_id: editingTransaction.category_id ?? undefined,
        payment_method: editingTransaction.payment_method,
        notes: editingTransaction.notes ?? '',
        is_recurring: editingTransaction.is_recurring,
      })
    } else if (open && !editingTransaction) {
      reset({
        type: 'expense',
        date: format(new Date(), 'yyyy-MM-dd'),
        is_recurring: false,
      })
    }
  }, [open, editingTransaction, reset])

  async function onSubmit(data: ModalFormValues) {
    let error: Error | null = null

    if (data.type === 'transfer') {
      const result = await transferBetweenAccounts(
        data.account_id,
        data.to_account_id!,
        data.amount,
        data.description,
        data.date
      )
      error = result.error ?? null
    } else {
      const payload = {
        type: data.type as TransactionType,
        amount: data.amount,
        description: data.description,
        date: data.date,
        account_id: data.account_id,
        category_id: data.category_id!,
        payment_method: data.payment_method!,
        notes: data.notes ?? null,
        is_recurring: data.is_recurring ?? false,
        recurring_id: null,
      }

      if (isEditing && editingId) {
        const result = await updateTransaction(editingId, payload)
        error = result.error ?? null
      } else {
        const result = await addTransaction(payload)
        error = result.error ?? null
      }
    }

    if (error) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      })
    } else {
      toast({
        title: isEditing ? 'Transação atualizada' : 'Transação criada',
        description: isEditing
          ? 'As alterações foram salvas com sucesso.'
          : 'Nova transação adicionada com sucesso.',
      })
      onClose()
    }
  }

  function handleClose() {
    if (!isSubmitting) onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar transação' : 'Nova transação'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-1">
          {/* Type selector */}
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <Tabs
              value={transactionType}
              onValueChange={(v) => {
                setValue('type', v as TransactionType, { shouldValidate: false })
                setValue('category_id', undefined)
                setValue('payment_method', undefined)
                setValue('to_account_id', undefined)
              }}
            >
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="expense">Despesa</TabsTrigger>
                <TabsTrigger value="income">Receita</TabsTrigger>
                <TabsTrigger value="transfer">Transferência</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="amount">Valor</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                className="pl-9"
                placeholder="0,00"
                {...register('amount', { valueAsNumber: true })}
              />
            </div>
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Ex: Almoço no restaurante"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="date">Data</Label>
            <Input id="date" type="date" {...register('date')} />
            {errors.date && (
              <p className="text-xs text-destructive">{errors.date.message}</p>
            )}
          </div>

          {transactionType === 'transfer' ? (
            /* ── Transfer fields ── */
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Conta de origem</Label>
                <Select
                  value={watch('account_id') ?? ''}
                  onValueChange={(v) => setValue('account_id', v, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.account_id && (
                  <p className="text-xs text-destructive">{errors.account_id.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Conta de destino</Label>
                <Select
                  value={watch('to_account_id') ?? ''}
                  onValueChange={(v) => setValue('to_account_id', v, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.to_account_id && (
                  <p className="text-xs text-destructive">{errors.to_account_id.message}</p>
                )}
              </div>
            </div>
          ) : (
            /* ── Income / Expense fields ── */
            <>
              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <div className="space-y-1.5">
                  <Label>Categoria</Label>
                  <Select
                    value={watch('category_id') ?? ''}
                    onValueChange={(v) => setValue('category_id', v, { shouldValidate: true })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          <span className="flex items-center gap-2">
                            <span>{cat.icon}</span>
                            <span>{cat.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category_id && (
                    <p className="text-xs text-destructive">{errors.category_id.message}</p>
                  )}
                </div>

                {/* Account */}
                <div className="space-y-1.5">
                  <Label>Conta</Label>
                  <Select
                    value={watch('account_id') ?? ''}
                    onValueChange={(v) => setValue('account_id', v, { shouldValidate: true })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.account_id && (
                    <p className="text-xs text-destructive">{errors.account_id.message}</p>
                  )}
                </div>
              </div>

              {/* Payment method */}
              <div className="space-y-1.5">
                <Label>Método de pagamento</Label>
                <Select
                  value={watch('payment_method') ?? ''}
                  onValueChange={(v) =>
                    setValue(
                      'payment_method',
                      v as ModalFormValues['payment_method'],
                      { shouldValidate: true }
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar método" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((pm) => (
                      <SelectItem key={pm.value} value={pm.value}>
                        {pm.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.payment_method && (
                  <p className="text-xs text-destructive">{errors.payment_method.message}</p>
                )}
              </div>
            </>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">
              Observações <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Textarea
              id="notes"
              rows={2}
              placeholder="Adicione uma observação..."
              {...register('notes')}
            />
          </div>

          <DialogFooter className="gap-2 pt-1">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Salvando...'
                : isEditing
                  ? 'Salvar alterações'
                  : 'Adicionar transação'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
