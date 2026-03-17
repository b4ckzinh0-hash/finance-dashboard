"use client"

import { SummaryCards } from '@/components/dashboard/summary-cards'
import { ExpensePieChart } from '@/components/dashboard/expense-pie-chart'
import { BalanceLineChart } from '@/components/dashboard/balance-line-chart'
import { MonthlyBarChart } from '@/components/dashboard/monthly-bar-chart'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { motion } from 'framer-motion'

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
