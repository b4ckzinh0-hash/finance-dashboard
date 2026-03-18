'use client'

import { motion } from 'framer-motion'
import { Building2 } from 'lucide-react'
import { ConnectBank } from '@/components/open-finance/connect-bank'

export default function OpenFinancePage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <Building2 className="h-6 w-6 text-violet-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Open Finance</h1>
          <p className="text-sm text-zinc-400">
            Conecte seus bancos e importe transações automaticamente.
          </p>
        </div>
      </div>

      <ConnectBank />
    </motion.div>
  )
}
