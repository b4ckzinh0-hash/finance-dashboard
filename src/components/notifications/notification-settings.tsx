'use client'

import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { usePushNotifications } from '@/hooks/use-push-notifications'

export function NotificationSettings() {
  const { supported, permission, prefs, updatePrefs, enable, disable } = usePushNotifications()

  if (!supported) {
    return (
      <p className="text-sm text-zinc-400">
        Seu navegador não suporta notificações push.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {/* Master toggle */}
      <div className="flex items-center justify-between rounded-lg border border-zinc-800 p-3">
        <div>
          <p className="text-sm font-medium text-white">Notificações push</p>
          <p className="text-xs text-zinc-400">
            {permission === 'denied'
              ? 'Permissão negada. Habilite nas configurações do navegador.'
              : 'Receba alertas mesmo quando o app estiver em segundo plano.'}
          </p>
        </div>
        <Switch
          checked={prefs.enabled}
          disabled={permission === 'denied'}
          onCheckedChange={async (val) => {
            if (val) {
              await enable()
            } else {
              disable()
            }
          }}
        />
      </div>

      {prefs.enabled && (
        <div className="space-y-3 pl-2">
          {/* Upcoming bills */}
          <div className="flex items-center justify-between">
            <Label className="text-sm text-zinc-300">
              ⏰ Contas a vencer (3 dias antes)
            </Label>
            <Switch
              checked={prefs.upcomingBills}
              onCheckedChange={(val) => updatePrefs({ upcomingBills: val })}
            />
          </div>

          {/* Budget alerts */}
          <div className="flex items-center justify-between">
            <Label className="text-sm text-zinc-300">
              ⚠️ Alertas de orçamento ({'>'}80% da média)
            </Label>
            <Switch
              checked={prefs.budgetAlerts}
              onCheckedChange={(val) => updatePrefs({ budgetAlerts: val })}
            />
          </div>

          {/* Low balance */}
          <div className="flex items-center justify-between">
            <Label className="text-sm text-zinc-300">
              💸 Saldo baixo
            </Label>
            <Switch
              checked={prefs.lowBalance}
              onCheckedChange={(val) => updatePrefs({ lowBalance: val })}
            />
          </div>

          {prefs.lowBalance && (
            <div className="flex items-center gap-3 pl-4">
              <Label className="text-xs text-zinc-400 whitespace-nowrap">
                Limite de saldo (R$)
              </Label>
              <Input
                type="number"
                min={0}
                value={prefs.lowBalanceThreshold}
                onChange={(e) =>
                  updatePrefs({ lowBalanceThreshold: Number(e.target.value) })
                }
                className="h-7 w-24 bg-zinc-800 border-zinc-700 text-xs"
              />
            </div>
          )}

          <Button
            size="sm"
            variant="outline"
            className="border-zinc-700 text-zinc-300 text-xs"
            onClick={() => {
              if (typeof window !== 'undefined' && Notification.permission === 'granted') {
                new Notification('✅ Notificações ativas!', {
                  body: 'Você receberá alertas sobre contas e saldo.',
                })
              }
            }}
          >
            Testar notificação
          </Button>
        </div>
      )}
    </div>
  )
}
