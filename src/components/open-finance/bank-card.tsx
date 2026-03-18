'use client'

import { Loader2, CheckCircle2, Link2Off, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { BankInstitution } from '@/lib/open-finance/registry'
import type { ConnectedBank } from '@/hooks/use-open-finance'

interface BankCardProps {
  bank: BankInstitution
  connection?: ConnectedBank
  onConnect: (bankId: string) => void
  onDisconnect: (bankId: string) => void
  onSync: (bankId: string) => void
  connecting: boolean
  syncing: boolean
}

const featureLabels: Record<string, string> = {
  accounts: 'Contas',
  transactions: 'Transações',
  credit_cards: 'Cartões',
  investments: 'Investimentos',
}

export function BankCard({
  bank,
  connection,
  onConnect,
  onDisconnect,
  onSync,
  connecting,
  syncing,
}: BankCardProps) {
  const isConnected = !!connection

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3 hover:border-zinc-700 transition-colors">
      {/* Bank identity */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg text-xl"
            style={{ backgroundColor: `${bank.primaryColor}22` }}
          >
            {bank.logo}
          </div>
          <div>
            <p className="font-semibold text-white text-sm">{bank.name}</p>
            <p className="text-xs text-zinc-500">Código: {bank.code}</p>
          </div>
        </div>

        {isConnected && (
          <div className="flex items-center gap-1 text-emerald-400 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Conectado</span>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="flex flex-wrap gap-1">
        {bank.supportedFeatures.map((f) => (
          <Badge key={f} variant="outline" className="text-[10px] border-zinc-700 text-zinc-400">
            {featureLabels[f] ?? f}
          </Badge>
        ))}
      </div>

      {/* Accounts summary (when connected) */}
      {connection && connection.accounts.length > 0 && (
        <div className="rounded-lg bg-zinc-800/50 p-2 space-y-1">
          {connection.accounts.map((acc) => (
            <div key={acc.id} className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 capitalize">
                {acc.type === 'checking'
                  ? 'Conta Corrente'
                  : acc.type === 'savings'
                  ? 'Poupança'
                  : acc.type === 'credit_card'
                  ? 'Cartão de Crédito'
                  : 'Investimento'}
              </span>
              <span className="text-white font-medium">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  acc.balance
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {isConnected ? (
          <>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-zinc-700 text-zinc-300 text-xs gap-1"
              onClick={() => onSync(bank.id)}
              disabled={syncing}
            >
              {syncing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Sincronizar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-zinc-700 text-red-400 hover:text-red-300 text-xs gap-1"
              onClick={() => onDisconnect(bank.id)}
            >
              <Link2Off className="h-3.5 w-3.5" />
              Desconectar
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            className="flex-1 text-xs gap-1"
            style={{ backgroundColor: bank.primaryColor === '#1A1A1A' ? '#3f3f46' : undefined }}
            onClick={() => onConnect(bank.id)}
            disabled={connecting}
          >
            {connecting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              '🔗'
            )}
            Conectar
          </Button>
        )}
      </div>
    </div>
  )
}
