"use client"

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Pencil, Trash2, ChevronLeft, ChevronRight, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { useTransactions } from '@/hooks/use-transactions'
import { useToast } from '@/components/ui/use-toast'
import { TransactionCard } from '@/components/transactions/transaction-card'
import { PAYMENT_METHODS } from '@/lib/constants'
import type { Transaction, TransactionFilters } from '@/types'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

function groupByDate(transactions: Transaction[]): Map<string, Transaction[]> {
  const groups = new Map<string, Transaction[]>()
  for (const t of transactions) {
    const key = t.date.slice(0, 10)
    const list = groups.get(key) ?? []
    list.push(t)
    groups.set(key, list)
  }
  return groups
}

function formatDateHeader(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "EEEE, d 'de' MMMM", { locale: ptBR })
  } catch {
    return dateStr
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)
}

function paymentLabel(method: string): string {
  return PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method
}

function typeLabel(type: string): string {
  if (type === 'income') return 'Receita'
  if (type === 'expense') return 'Despesa'
  return 'Transferência'
}

interface TransactionListProps {
  onEdit: (id: string) => void
}

export function TransactionList({ onEdit }: TransactionListProps) {
  const searchParams = useSearchParams()
  const { transactions, loading, filterTransactions, deleteTransaction } = useTransactions()
  const { toast } = useToast()

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const currentPage = Number(searchParams.get('page') ?? '1')

  const filters: TransactionFilters = useMemo(() => {
    const type = searchParams.get('type') as TransactionFilters['type'] | null
    return {
      type: type ?? undefined,
      category_id: searchParams.get('category_id') ?? undefined,
      account_id: searchParams.get('account_id') ?? undefined,
      date_from: searchParams.get('date_from') ?? undefined,
      date_to: searchParams.get('date_to') ?? undefined,
      search: searchParams.get('search') ?? undefined,
    }
  }, [searchParams])

  const filtered = useMemo(
    () => filterTransactions(filters),
    [filterTransactions, filters]
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page = Math.min(currentPage, totalPages)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const totalIncome = filtered
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0)
  const totalExpense = filtered
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)

  const grouped = useMemo(() => groupByDate(paginated), [paginated])
  const sortedDateKeys = Array.from(grouped.keys()).sort((a, b) => (a < b ? 1 : -1))

  function handleDeleteClick(id: string) {
    setDeletingId(id)
    setConfirmOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!deletingId) return
    setIsDeleting(true)
    const { error } = await deleteTransaction(deletingId)
    setIsDeleting(false)
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Transação excluída', description: 'A transação foi removida com sucesso.' })
    }
    setConfirmOpen(false)
    setDeletingId(null)
  }

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(newPage))
    window.history.replaceState(null, '', `?${params.toString()}`)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-card border rounded-xl p-4 space-y-3">
            <Skeleton className="h-4 w-32" />
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <div className="bg-card border rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Receipt className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Nenhuma transação encontrada</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Tente ajustar os filtros ou adicione uma nova transação.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Summary bar */}
      <div className="bg-card border rounded-xl px-4 py-3 flex flex-wrap gap-4 items-center text-sm">
        <span className="text-muted-foreground">
          {filtered.length} transaç{filtered.length !== 1 ? 'ões' : 'ão'}
        </span>
        <span className="text-emerald-600 font-medium">
          Receitas: {formatCurrency(totalIncome)}
        </span>
        <span className="text-rose-600 font-medium">
          Despesas: {formatCurrency(totalExpense)}
        </span>
        <span className="font-semibold ml-auto">
          Saldo: {formatCurrency(totalIncome - totalExpense)}
        </span>
      </div>

      {/* Mobile view */}
      <div className="md:hidden space-y-3">
        {sortedDateKeys.map((dateKey) => {
          const dayTransactions = grouped.get(dateKey) ?? []
          return (
            <div key={dateKey} className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
                {formatDateHeader(dateKey)}
              </p>
              {dayTransactions.map((t) => (
                <TransactionCard
                  key={t.id}
                  transaction={t}
                  onEdit={() => onEdit(t.id)}
                  onDelete={() => handleDeleteClick(t.id)}
                />
              ))}
            </div>
          )
        })}
      </div>

      {/* Desktop view */}
      <div className="hidden md:block bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Data</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Descrição</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Categoria</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Pagamento</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Conta</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Valor</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {sortedDateKeys.map((dateKey) => {
              const dayTransactions = grouped.get(dateKey) ?? []
              return (
                <>
                  <tr key={`header-${dateKey}`} className="bg-muted/20 border-b border-t">
                    <td colSpan={7} className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {formatDateHeader(dateKey)}
                    </td>
                  </tr>
                  {dayTransactions.map((t) => (
                    <DesktopTransactionRow
                      key={t.id}
                      transaction={t}
                      onEdit={() => onEdit(t.id)}
                      onDelete={() => handleDeleteClick(t.id)}
                    />
                  ))}
                </>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir transação</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface RowProps {
  transaction: Transaction
  onEdit: () => void
  onDelete: () => void
}

function DesktopTransactionRow({ transaction: t, onEdit, onDelete }: RowProps) {
  return (
    <tr className="border-b last:border-0 hover:bg-muted/30 transition-colors group">
      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
        {format(parseISO(t.date), 'dd/MM/yyyy')}
      </td>
      <td className="px-4 py-3 font-medium max-w-[200px] truncate">
        {t.description}
      </td>
      <td className="px-4 py-3">
        {t.category ? (
          <span className="flex items-center gap-2">
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0"
              style={{ backgroundColor: t.category.color + '22', color: t.category.color }}
            >
              {t.category.icon}
            </span>
            <span className="text-sm text-muted-foreground truncate max-w-[100px]">
              {t.category.name}
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">
            {typeLabel(t.type)}
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <Badge variant="secondary" className="text-xs font-normal">
          {paymentLabel(t.payment_method)}
        </Badge>
      </td>
      <td className="px-4 py-3 text-muted-foreground text-sm truncate max-w-[120px]">
        {t.account?.name ?? '—'}
      </td>
      <td className={cn(
        'px-4 py-3 text-right font-semibold tabular-nums',
        t.type === 'income' ? 'text-emerald-600' : t.type === 'expense' ? 'text-rose-600' : 'text-blue-600'
      )}>
        {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  )
}
