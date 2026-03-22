"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TransactionList } from '@/components/transactions/transaction-list'
import { TransactionModal } from '@/components/transactions/transaction-modal'
import { TransactionFilters } from '@/components/transactions/transaction-filters'
import { AutoCategorizeButton } from '@/components/ai/auto-categorize-button'

export default function TransactionsPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transações</h1>
          <p className="text-muted-foreground">Gerencie suas receitas e despesas</p>
        </div>
        <div className="flex items-center gap-2">
          <AutoCategorizeButton />
          <Button onClick={() => { setEditingId(null); setModalOpen(true) }}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Transação
          </Button>
        </div>
      </div>

      <TransactionFilters />
      <TransactionList onEdit={(id) => { setEditingId(id); setModalOpen(true) }} />
      <TransactionModal open={modalOpen} onClose={() => setModalOpen(false)} editingId={editingId} />
    </motion.div>
  )
}
