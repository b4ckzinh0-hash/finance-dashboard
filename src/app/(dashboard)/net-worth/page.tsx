'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { useAccountsContext } from '@/contexts/data-provider'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

interface NetWorthSnapshot {
  id: string
  user_id: string
  date: string
  total_assets: number
  total_liabilities: number
  net_worth: number
}

interface ChartDataPoint {
  month: string
  value: number
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 shadow-lg">
        <p className="text-xs text-zinc-400 mb-1">{label}</p>
        <p className="text-violet-400 font-bold">{formatCurrency(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

export default function NetWorthPage() {
  const supabase = useRef(createClient()).current
  const { accounts, totalBalance, loading: accLoading } = useAccountsContext()
  const { toast } = useToast()

  const [snapshots, setSnapshots] = useState<NetWorthSnapshot[]>([])
  const [snapshotsLoading, setSnapshotsLoading] = useState(true)

  const fetchSnapshots = useCallback(async () => {
    setSnapshotsLoading(true)
    const { data, error } = await supabase
      .from('net_worth_snapshots')
      .select('*')
      .order('date', { ascending: true })
      .limit(12)
    if (error) {
      toast({ title: 'Erro ao carregar histórico de patrimônio', variant: 'destructive' })
    } else {
      setSnapshots((data as NetWorthSnapshot[]) ?? [])
    }
    setSnapshotsLoading(false)
  }, [supabase, toast])

  useEffect(() => { fetchSnapshots() }, [fetchSnapshots])

  // Save today's snapshot based on current account balances
  useEffect(() => {
    if (accLoading || accounts.length === 0) return
    const saveSnapshot = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const today = new Date().toISOString().split('T')[0]
      const totalAssets = accounts
        .filter(a => a.is_active && a.balance > 0)
        .reduce((s, a) => s + a.balance, 0)
      const totalLiabilities = accounts
        .filter(a => a.is_active && a.balance < 0)
        .reduce((s, a) => s + Math.abs(a.balance), 0)
      await supabase
        .from('net_worth_snapshots')
        .upsert(
          { user_id: user.id, date: today, total_assets: totalAssets, total_liabilities: totalLiabilities },
          { onConflict: 'user_id,date' }
        )
      fetchSnapshots()
    }
    saveSnapshot()
  }, [accLoading, accounts, supabase, fetchSnapshots])

  const chartData: ChartDataPoint[] = snapshots.map(s => ({
    month: new Date(s.date + 'T00:00:00').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
    value: s.net_worth,
  }))

  // Monthly change
  const lastTwo = snapshots.slice(-2)
  const monthlyChange = lastTwo.length === 2 ? lastTwo[1].net_worth - lastTwo[0].net_worth : 0

  const isLoading = accLoading || snapshotsLoading
  const activeAccounts = accounts.filter(a => a.is_active)

  // Largest account (among active accounts only)
  const largestAccount = activeAccounts.length > 0
    ? activeAccounts.reduce((a, b) => (a.balance > b.balance ? a : b))
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-500/10">
          <TrendingUp className="h-6 w-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Patrimônio Líquido</h1>
          <p className="text-sm text-zinc-400">Acompanhe a evolução do seu patrimônio</p>
        </div>
      </div>

      {/* Summary cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-3 w-24 bg-zinc-800" />
                <Skeleton className="h-7 w-36 bg-zinc-800" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-400 uppercase tracking-wide">Patrimônio Total</p>
              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalBalance)}</p>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-400 uppercase tracking-wide">Variação no Mês</p>
              <div className="flex items-center gap-2 mt-1">
                {monthlyChange >= 0
                  ? <TrendingUp className="h-5 w-5 text-emerald-400" />
                  : <TrendingDown className="h-5 w-5 text-red-400" />}
                <p className={`text-2xl font-bold ${monthlyChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {monthlyChange >= 0 ? '+' : ''}{formatCurrency(monthlyChange)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <p className="text-xs text-zinc-400 uppercase tracking-wide">Maior Conta</p>
              {largestAccount ? (
                <>
                  <p className="text-lg font-bold text-white mt-1">{largestAccount.name}</p>
                  <p className="text-sm text-violet-400">{formatCurrency(largestAccount.balance)}</p>
                </>
              ) : (
                <p className="text-zinc-500 mt-1">—</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-base">Evolução do Patrimônio</CardTitle>
        </CardHeader>
        <CardContent>
          {snapshotsLoading ? (
            <Skeleton className="h-64 w-full bg-zinc-800" />
          ) : chartData.length < 2 ? (
            <div className="flex items-center justify-center h-64 text-zinc-500">
              <p>Dados insuficientes para exibir o gráfico</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={256}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="month" tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fill: '#a1a1aa', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => formatCurrency(v).replace('R$\u00a0', 'R$ ')}
                  width={90}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Accounts list */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-base">Contas</CardTitle>
        </CardHeader>
        <CardContent>
          {accLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32 bg-zinc-800" />
                  <Skeleton className="h-4 w-24 bg-zinc-800" />
                </div>
              ))}
            </div>
          ) : activeAccounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-2">
              <Wallet className="h-10 w-10 text-zinc-600" />
              <p className="text-zinc-400">Nenhuma conta ativa encontrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeAccounts.map((account, i) => (
                <motion.div
                  key={account.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                      style={{ backgroundColor: account.color + '33', color: account.color }}
                    >
                      {account.icon}
                    </div>
                    <span className="text-white font-medium">{account.name}</span>
                  </div>
                  <span className={`font-semibold ${account.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(account.balance)}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
