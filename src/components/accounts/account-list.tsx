'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAccounts } from '@/hooks/use-accounts'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency } from '@/lib/utils'
import { ACCOUNT_TYPES } from '@/lib/constants'
import type { Account } from '@/types'

interface AccountListProps {
  onEdit: (account: Account) => void
  onDelete: (id: string) => void
}

export default function AccountList({ onEdit }: AccountListProps) {
  const { accounts, loading, deleteAccount } = useAccounts()
  const { toast } = useToast()

  async function handleDelete(id: string) {
    const { error } = await deleteAccount(id)
    if (error) {
      toast({ title: 'Erro ao excluir conta', description: String(error), variant: 'destructive' })
    } else {
      toast({ title: 'Conta excluída com sucesso' })
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-5 space-y-3">
              <Skeleton className="h-5 w-32 bg-zinc-800" />
              <Skeleton className="h-4 w-20 bg-zinc-800" />
              <Skeleton className="h-7 w-28 bg-zinc-800" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 py-16 text-center">
        <p className="text-zinc-400">Nenhuma conta cadastrada.</p>
        <p className="text-sm text-zinc-500 mt-1">Clique em "Nova Conta" para adicionar.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {accounts.map((account) => {
        const typeInfo = ACCOUNT_TYPES.find((t) => t.value === account.type)
        return (
          <Card
            key={account.id}
            className="bg-zinc-900 border-zinc-800 overflow-hidden"
          >
            <div className="flex h-full">
              <div className="w-1 flex-shrink-0" style={{ backgroundColor: account.color }} />
              <CardContent className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{account.icon}</span>
                    <div>
                      <p className="font-semibold text-white leading-tight">{account.name}</p>
                      <p className="text-xs text-zinc-400">
                        {typeInfo?.icon} {typeInfo?.label}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-zinc-400 hover:text-white"
                      onClick={() => onEdit(account)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-zinc-400 hover:text-red-400"
                      onClick={() => handleDelete(account.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="text-xl font-bold" style={{ color: account.color }}>
                  {formatCurrency(account.balance)}
                </p>
              </CardContent>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
