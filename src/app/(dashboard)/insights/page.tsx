'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import AiSummary from '@/components/insights/ai-summary'
import SpendingPatterns from '@/components/insights/spending-patterns'
import SmartAlerts from '@/components/insights/smart-alerts'
import SavingsSuggestions from '@/components/insights/savings-suggestions'

export default function InsightsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-violet-400" />
          <h1 className="text-2xl font-bold text-white">Insights IA</h1>
        </div>
        <p className="text-sm text-zinc-400 mt-1">
          Análise inteligente das suas finanças pessoais
        </p>
      </div>

      <AiSummary />

      <div className="grid gap-6 lg:grid-cols-2">
        <SpendingPatterns />
        <SmartAlerts />
      </div>

      <SavingsSuggestions />
    </motion.div>
  )
}
