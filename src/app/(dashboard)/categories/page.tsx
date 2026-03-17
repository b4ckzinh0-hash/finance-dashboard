'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import CategoryList from '@/components/categories/category-list'
import CategoryModal from '@/components/categories/category-modal'
import type { Category } from '@/types'

export default function CategoriesPage() {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  function handleEdit(cat: Category) {
    setEditingCategory(cat)
    setModalOpen(true)
  }

  function handleAdd() {
    setEditingCategory(null)
    setModalOpen(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Categorias</h1>
        <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-emerald-400 mb-3">Receitas</h2>
          <CategoryList type="income" onEdit={handleEdit} onDelete={() => {}} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-red-400 mb-3">Despesas</h2>
          <CategoryList type="expense" onEdit={handleEdit} onDelete={() => {}} />
        </div>
      </div>

      <CategoryModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingCategory(null) }}
        editingCategory={editingCategory}
      />
    </motion.div>
  )
}
