'use client'

import { useState, useEffect } from 'react'
import { Loader2, Building2, AlertCircle, Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BankCard } from './bank-card'
import { PluggyConnectWidget } from './pluggy-connect-widget'
import { BelvoConnectWidget } from './belvo-connect-widget'
import { useOpenFinance, type OpenFinanceProvider } from '@/hooks/use-open-finance'

/** Time (ms) after which a "taking longer than expected" hint is shown during initial load. */
const SLOW_LOAD_HINT_MS = 5_000

/** Skeleton card shown while banks are loading. */
function BankCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-zinc-800" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-zinc-800" />
          <div className="h-3 w-1/2 rounded bg-zinc-800" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-zinc-800" />
        <div className="h-3 w-4/5 rounded bg-zinc-800" />
      </div>
    </div>
  )
}

export function ConnectBank() {
  const {
    connectedBanks,
    connectToken,
    loading,
    loadError,
    connecting,
    syncing,
    pluggyConfigured,
    belvoConfigured,
    activeProvider,
    openConnectWidget,
    onWidgetSuccess,
    onWidgetError,
    onWidgetClose,
    disconnectBank,
    syncBankData,
    loadItems,
    switchProvider,
  } = useOpenFinance()

  const [slowLoad, setSlowLoad] = useState(false)

  // Show a "taking longer than expected" hint after SLOW_LOAD_HINT_MS ms.
  useEffect(() => {
    if (!loading) {
      setSlowLoad(false)
      return
    }
    const id = setTimeout(() => setSlowLoad(true), SLOW_LOAD_HINT_MS)
    return () => clearTimeout(id)
  }, [loading])

  const bothConfigured = pluggyConfigured && belvoConfigured

  const providerLabel = activeProvider === 'belvo' ? 'Belvo' : 'Pluggy'
  const providerUrl = activeProvider === 'belvo' ? 'https://belvo.com' : 'https://pluggy.ai'

  // ── Not configured ─────────────────────────────────────────────────────────
  if (!pluggyConfigured && !belvoConfigured) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-yellow-800/50 bg-yellow-950/20 p-8 text-center">
        <AlertCircle className="h-10 w-10 text-yellow-400" />
        <div>
          <p className="font-semibold text-yellow-300 text-lg">Open Finance não configurado</p>
          <p className="text-sm text-yellow-400 mt-1 max-w-sm">
            Configure as variáveis do Pluggy (
            <code className="font-mono bg-yellow-900/40 px-1 rounded">PLUGGY_CLIENT_ID</code> e{' '}
            <code className="font-mono bg-yellow-900/40 px-1 rounded">PLUGGY_CLIENT_SECRET</code>)
            ou do Belvo (
            <code className="font-mono bg-yellow-900/40 px-1 rounded">BELVO_SECRET_ID</code> e{' '}
            <code className="font-mono bg-yellow-900/40 px-1 rounded">BELVO_SECRET_PASSWORD</code>)
            nas configurações da Vercel.
          </p>
        </div>
        <div className="flex gap-3">
          <a
            href="https://dashboard.pluggy.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-yellow-500 underline"
          >
            Dashboard Pluggy →
          </a>
          <a
            href="https://dashboard.belvo.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-yellow-500 underline"
          >
            Dashboard Belvo →
          </a>
        </div>
      </div>
    )
  }

  // ── Loading — show skeleton screens ────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        {slowLoad && (
          <p className="text-sm text-zinc-400 text-center">Demorando mais que o esperado...</p>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <BankCardSkeleton />
          <BankCardSkeleton />
          <BankCardSkeleton />
        </div>
      </div>
    )
  }

  // ── Load error — show retry ─────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-red-800/50 bg-red-950/20 p-8 text-center">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <div>
          <p className="font-semibold text-red-300 text-lg">Erro ao carregar bancos conectados</p>
          <p className="text-sm text-red-400 mt-1">
            Não foi possível obter a lista de bancos via {providerLabel}. Verifique sua conexão.
          </p>
        </div>
        <Button
          variant="outline"
          className="border-red-700 text-red-300 gap-2"
          onClick={loadItems}
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Connect widgets (render nothing visually — overlays managed by scripts) */}
      {connectToken && activeProvider === 'pluggy' && (
        <PluggyConnectWidget
          connectToken={connectToken}
          onSuccess={onWidgetSuccess}
          onError={onWidgetError}
          onClose={onWidgetClose}
        />
      )}
      {connectToken && activeProvider === 'belvo' && (
        <BelvoConnectWidget
          connectToken={connectToken}
          onSuccess={(linkId) => onWidgetSuccess(linkId)}
          onError={onWidgetError}
          onClose={onWidgetClose}
        />
      )}

      {/* Provider selector (shown only when both are configured) */}
      {bothConfigured && (
        <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
          <span className="text-xs text-zinc-500 mr-1">Provedor:</span>
          {(['pluggy', 'belvo'] as OpenFinanceProvider[]).map((p) => (
            <button
              key={p}
              onClick={() => switchProvider(p)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                activeProvider === p
                  ? 'bg-violet-600 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {p === 'pluggy' ? 'Pluggy' : 'Belvo'}
            </button>
          ))}
        </div>
      )}

      {/* Header actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">
          {connectedBanks.length === 0
            ? 'Nenhum banco conectado. Clique em "Conectar Banco" para começar.'
            : `${connectedBanks.length} banco(s) conectado(s) via ${providerLabel} Open Finance.`}
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

      {/* Provider attribution */}
      <p className="text-center text-xs text-zinc-600">
        Conexões seguras via{' '}
        <a
          href={providerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-500 underline"
        >
          {providerLabel}
        </a>{' '}
        · Open Finance Brasil · Dados somente leitura
      </p>
    </div>
  )
}
