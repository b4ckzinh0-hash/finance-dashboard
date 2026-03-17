'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGoals } from '@/hooks/use-goals'
import { formatCurrency } from '@/lib/utils'
import GoalList from '@/components/goals/goal-list'
import GoalModal from '@/components/goals/goal-modal'
import type { Goal } from '@/types'

export default function GoalsPage() {
  const { activeGoals } = useGoals()
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const totalTarget = activeGoals.reduce((s, g) => s + g.target_amount, 0)
  const totalSaved = activeGoals.reduce((s, g) => s + g.current_amount, 0)

  function handleEdit(goal: Goal) {
    setEditingGoal(goal)
    setModalOpen(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Metas Financeiras</h1>
          {activeGoals.length > 0 && (
            <p className="text-sm text-zinc-400">
              {formatCurrency(totalSaved)} de {formatCurrency(totalTarget)} economizados
            </p>
          )}
        </div>
        <Button
          className="bg-violet-600 hover:bg-violet-700 text-white"
          onClick={() => { setEditingGoal(null); setModalOpen(true) }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Meta
        </Button>
      </div>

      <GoalList onEdit={handleEdit} />

      <GoalModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingGoal(null) }}
        editingGoal={editingGoal}
      />
    </motion.div>
  )
}
