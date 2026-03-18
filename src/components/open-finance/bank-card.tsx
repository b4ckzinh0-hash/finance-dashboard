'use client'

import { Loader2, CheckCircle2, Link2Off, RefreshCw, AlertTriangle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { ConnectedBank } from '@/hooks/use-open-finance'

interface BankCardProps {
  bank: ConnectedBank
  onDisconnect: (itemId: string) => void
  onSync: (itemId: string) => void
  onReconnect: (itemId: string) => void
  syncing: boolean
}

const subtypeLabels: Record<string, string> = {
  CHECKING_ACCOUNT: 'Conta Corrente',
  SAVINGS_ACCOUNT: 'Poupança',
  CREDIT_CARD: 'Cartão de Crédito',
  INVESTMENT: 'Investimentos',
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode; showReconnect: boolean }
> = {
  UPDATED: {
    label: 'Atualizado',
    color: 'text-emerald-400',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    showReconnect: false,
  },
  UPDATING: {
    label: 'Atualizando...',
    color: 'text-blue-400',
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    showReconnect: false,
  },
  WAITING_USER_INPUT: {
    label: 'Reconexão necessária',
    color: 'text-yellow-400',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    showReconnect: true,
  },
  LOGIN_ERROR: {
    label: 'Erro de login',
    color: 'text-red-400',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    showReconnect: true,
  },
  OUTDATED: {
    label: 'Desatualizado',
    color: 'text-orange-400',
    icon: <Clock className="h-3.5 w-3.5" />,
    showReconnect: false,
  },
  ERROR: {
    label: 'Erro',
    color: 'text-red-400',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    showReconnect: true,
  },
}

export function BankCard({ bank, onDisconnect, onSync, onReconnect, syncing }: BankCardProps) {
  const status = statusConfig[bank.status] ?? statusConfig['UPDATED']
  const primaryColor = bank.connectorPrimaryColor ?? '#6d28d9'
  const totalBalance = bank.accounts
    .filter((a) => a.type === 'BANK')
    .reduce((sum, a) => sum + a.balance, 0)

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  const formatDate = (dateStr: string) =>
    new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
      new Date(dateStr)
    )

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3 hover:border-zinc-700 transition-colors">
      {/* Bank identity */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {bank.connectorImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bank.connectorImageUrl}
              alt={bank.connectorName}
              className="h-10 w-10 rounded-lg object-contain bg-white p-1"
            />
          ) : (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg text-xl font-bold text-white"
              style={{ backgroundColor: `${primaryColor}33` }}
            >
              {bank.connectorName.charAt(0)}
            </div>
          )}
          <div>
            <p className="font-semibold text-white text-sm">{bank.connectorName}</p>
            <p className="text-xs text-zinc-500">Conectado em {formatDate(bank.connectedAt)}</p>
          </div>
        </div>

        <div className={`flex items-center gap-1 text-xs ${status.color}`}>
          {status.icon}
          <span>{status.label}</span>
        </div>
      </div>

      {/* Account types badges */}
      {bank.accounts.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {bank.accounts.map((acc) => (
            <Badge key={acc.id} variant="outline" className="text-[10px] border-zinc-700 text-zinc-400">
              {subtypeLabels[acc.subtype] ?? acc.subtype}
            </Badge>
          ))}
        </div>
      )}

      {/* Accounts summary */}
      {bank.accounts.length > 0 && (
        <div className="rounded-lg bg-zinc-800/50 p-2 space-y-1">
          {bank.accounts.map((acc) => (
            <div key={acc.id} className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">{subtypeLabels[acc.subtype] ?? acc.subtype}</span>
              <span className="text-white font-medium">{formatCurrency(acc.balance)}</span>
            </div>
          ))}
          {bank.accounts.filter((a) => a.type === 'BANK').length > 1 && (
            <div className="flex items-center justify-between text-xs border-t border-zinc-700 pt-1 mt-1">
              <span className="text-zinc-400 font-medium">Total</span>
              <span className="text-emerald-400 font-semibold">{formatCurrency(totalBalance)}</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {status.showReconnect ? (
          <Button
            size="sm"
            className="flex-1 text-xs gap-1 bg-yellow-600 hover:bg-yellow-700"
            onClick={() => onReconnect(bank.itemId)}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reconectar
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 border-zinc-700 text-zinc-300 text-xs gap-1"
            onClick={() => onSync(bank.itemId)}
            disabled={syncing}
          >
            {syncing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Sincronizar
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="border-zinc-700 text-red-400 hover:text-red-300 text-xs gap-1"
          onClick={() => onDisconnect(bank.itemId)}
        >
          <Link2Off className="h-3.5 w-3.5" />
          Desconectar
        </Button>
      </div>
    </div>
  )
}
