'use client'

import { useState } from 'react'
import { Shield, Info } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { BankCard } from './bank-card'
import { getAllBanks } from '@/lib/open-finance/registry'
import { useOpenFinance } from '@/hooks/use-open-finance'

export function ConnectBank() {
  const {
    connectedBanks,
    connecting,
    syncing,
    connectBank,
    disconnectBank,
    syncBankTransactions,
    isConnected,
  } = useOpenFinance()

  const [consentBankId, setConsentBankId] = useState<string | null>(null)
  const allBanks = getAllBanks()

  const handleConnectRequest = (bankId: string) => {
    setConsentBankId(bankId)
  }

  const handleConsentConfirm = async () => {
    if (!consentBankId) return
    setConsentBankId(null)
    await connectBank(consentBankId)
  }

  const consentBank = consentBankId ? allBanks.find((b) => b.id === consentBankId) : null

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-800/50 bg-blue-950/20 p-4">
        <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-300">Open Finance (Simulado)</p>
          <p className="text-xs text-blue-400 mt-1">
            Esta é uma demonstração com dados simulados. Nenhuma conexão real é estabelecida com
            os bancos. Em produção, utilizaria o protocolo Open Finance Brasil.
          </p>
        </div>
      </div>

      {/* Bank grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {allBanks.map((bank) => {
          const connection = connectedBanks.find((c) => c.bankId === bank.id)
          return (
            <BankCard
              key={bank.id}
              bank={bank}
              connection={connection}
              onConnect={handleConnectRequest}
              onDisconnect={disconnectBank}
              onSync={syncBankTransactions}
              connecting={connecting === bank.id}
              syncing={syncing === bank.id}
            />
          )
        })}
      </div>

      {/* Consent dialog */}
      <Dialog open={!!consentBankId} onOpenChange={(o) => !o && setConsentBankId(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-violet-400" />
              Autorização de Acesso
            </DialogTitle>
          </DialogHeader>

          {consentBank && (
            <div className="space-y-4">
              <p className="text-sm text-zinc-300">
                Você está prestes a conectar o{' '}
                <span className="font-semibold text-white">{consentBank.name}</span> ao Finance
                Dashboard.
              </p>

              <div className="rounded-lg bg-zinc-800 p-3 space-y-2">
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                  Dados que serão acessados:
                </p>
                <ul className="space-y-1">
                  {consentBank.supportedFeatures.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                      <span className="text-emerald-400">✓</span>
                      {f === 'accounts' && 'Informações de contas e saldos'}
                      {f === 'transactions' && 'Histórico de transações (60 dias)'}
                      {f === 'credit_cards' && 'Faturas e limites de cartão de crédito'}
                      {f === 'investments' && 'Posição de investimentos'}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-zinc-500">
                O acesso é somente leitura. Você pode revogar a qualquer momento.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="border-zinc-700 text-zinc-300"
              onClick={() => setConsentBankId(null)}
            >
              Cancelar
            </Button>
            <Button
              className="bg-violet-600 hover:bg-violet-700"
              onClick={handleConsentConfirm}
            >
              Autorizar acesso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
