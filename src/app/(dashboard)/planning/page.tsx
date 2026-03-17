'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import UpcomingBills from '@/components/planning/upcoming-bills'
import RecurringExpenses from '@/components/planning/recurring-expenses'
import BillModal from '@/components/planning/bill-modal'
import type { RecurringExpense } from '@/types'

export default function PlanningPage() {
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  function handleEdit(expense: RecurringExpense) {
    setEditingExpense(expense)
    setModalOpen(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Planejamento</h1>
        <Button
          className="bg-violet-600 hover:bg-violet-700 text-white"
          onClick={() => { setEditingExpense(null); setModalOpen(true) }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Despesa Recorrente
        </Button>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-yellow-400">Próximos Vencimentos</h2>
        <UpcomingBills onMarkPaid={() => {}} />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-zinc-300">Todas as Despesas Recorrentes</h2>
        <RecurringExpenses onEdit={handleEdit} />
      </div>

      <BillModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingExpense(null) }}
        editingExpense={editingExpense}
      />
    </motion.div>
  )
}
