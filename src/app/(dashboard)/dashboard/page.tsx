"use client"

import dynamic from 'next/dynamic'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { motion } from 'framer-motion'

const ChartSkeleton = () => (
  <Card className="backdrop-blur-sm bg-card/80 border-border/50">
    <CardHeader>
      <Skeleton className="h-5 w-40" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-64 w-full" />
    </CardContent>
  </Card>
)

const BalanceLineChart = dynamic(
  () => import('@/components/dashboard/balance-line-chart').then((m) => m.BalanceLineChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

const ExpensePieChart = dynamic(
  () => import('@/components/dashboard/expense-pie-chart').then((m) => m.ExpensePieChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

const MonthlyBarChart = dynamic(
  () => import('@/components/dashboard/monthly-bar-chart').then((m) => m.MonthlyBarChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

export default function DashboardPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral das suas finanças</p>
      </div>

      <SummaryCards />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BalanceLineChart />
        <ExpensePieChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyBarChart />
        <RecentTransactions />
      </div>
    </motion.div>
  )
}
