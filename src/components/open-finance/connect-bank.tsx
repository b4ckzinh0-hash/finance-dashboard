'use client'

import { Loader2, Building2, AlertCircle, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BankCard } from './bank-card'
import { PluggyConnectWidget } from './pluggy-connect-widget'
import { useOpenFinance } from '@/hooks/use-open-finance'

export function ConnectBank() {
  const {
    connectedBanks,
    connectToken,
    loading,
    connecting,
    syncing,
    pluggyConfigured,
    openConnectWidget,
    onWidgetSuccess,
    onWidgetError,
    onWidgetClose,
    disconnectBank,
    syncBankData,
    loadItems,
  } = useOpenFinance()

  // ── Not configured ─────────────────────────────────────────────────────────
  if (!pluggyConfigured) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-yellow-800/50 bg-yellow-950/20 p-8 text-center">
        <AlertCircle className="h-10 w-10 text-yellow-400" />
        <div>
          <p className="font-semibold text-yellow-300 text-lg">Pluggy não configurado</p>
          <p className="text-sm text-yellow-400 mt-1 max-w-sm">
            Configure as variáveis{' '}
            <code className="font-mono bg-yellow-900/40 px-1 rounded">PLUGGY_CLIENT_ID</code> e{' '}
            <code className="font-mono bg-yellow-900/40 px-1 rounded">PLUGGY_CLIENT_SECRET</code>{' '}
            nas configurações da Vercel para habilitar o Open Finance.
          </p>
        </div>
        <a
          href="https://dashboard.pluggy.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-yellow-500 underline"
        >
          Acessar dashboard Pluggy →
        </a>
      </div>
    )
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pluggy Connect widget (renders nothing visually — overlay managed by script) */}
      {connectToken && (
        <PluggyConnectWidget
          connectToken={connectToken}
          onSuccess={onWidgetSuccess}
          onError={onWidgetError}
          onClose={onWidgetClose}
        />
      )}

      {/* Header actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">
          {connectedBanks.length === 0
            ? 'Nenhum banco conectado. Clique em "Conectar Banco" para começar.'
            : `${connectedBanks.length} banco(s) conectado(s) via Pluggy Open Finance.`}
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-zinc-700 text-zinc-300 gap-1"
            onClick={loadItems}
            disabled={loading}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Atualizar
          </Button>
          <Button
            size="sm"
            className="bg-violet-600 hover:bg-violet-700 gap-2"
            onClick={() => openConnectWidget()}
            disabled={connecting}
          >
            {connecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Conectar Banco
          </Button>
        </div>
      </div>

      {/* Connected banks grid */}
      {connectedBanks.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {connectedBanks.map((bank) => (
            <BankCard
              key={bank.itemId}
              bank={bank}
              onDisconnect={disconnectBank}
              onSync={syncBankData}
              onReconnect={(itemId) => openConnectWidget(itemId)}
              syncing={syncing === bank.itemId}
            />
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-900/30">
            <Building2 className="h-8 w-8 text-violet-400" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-white">Nenhum banco conectado</p>
            <p className="text-sm text-zinc-400 mt-1">
              Conecte seu banco para importar transações e saldos reais.
            </p>
          </div>
          <Button
            className="bg-violet-600 hover:bg-violet-700 gap-2 mt-2"
            onClick={() => openConnectWidget()}
            disabled={connecting}
          >
            {connecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Conectar meu primeiro banco
          </Button>
        </div>
      )}

      {/* Pluggy attribution */}
      <p className="text-center text-xs text-zinc-600">
        Conexões seguras via{' '}
        <a
          href="https://pluggy.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-500 underline"
        >
          Pluggy
        </a>{' '}
        · Open Finance Brasil · Dados somente leitura
      </p>
    </div>
  )
}
