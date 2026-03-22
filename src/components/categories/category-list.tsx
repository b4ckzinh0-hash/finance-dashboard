'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategories } from '@/hooks/use-categories'
import { useToast } from '@/components/ui/use-toast'
import type { Category, CategoryType } from '@/types'

interface CategoryListProps {
  type: CategoryType
  onEdit: (cat: Category) => void
  onDelete: (id: string) => void
}

export default function CategoryList({ type, onEdit }: CategoryListProps) {
  const { expenseCategories, incomeCategories, loading, deleteCategory } = useCategories()
  const { toast } = useToast()

  const categories = type === 'income' ? incomeCategories : expenseCategories

  async function handleDelete(id: string) {
    const { error } = await deleteCategory(id)
    if (error) {
      toast({ title: 'Erro ao excluir categoria', description: String(error), variant: 'destructive' })
    } else {
      toast({ title: 'Categoria excluída com sucesso' })
    }
  }

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4 flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full bg-zinc-800" />
              <Skeleton className="h-4 w-24 bg-zinc-800" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <p className="text-sm text-zinc-500 py-4">Nenhuma categoria encontrada.</p>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {categories.map((cat) => (
        <Card key={cat.id} className="bg-zinc-900 border-zinc-800">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-lg"
                style={{ backgroundColor: `${cat.color}22` }}
              >
                {cat.icon}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">{cat.name}</span>
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-zinc-400 hover:text-white"
                onClick={() => onEdit(cat)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              {!cat.is_default && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-zinc-400 hover:text-red-400"
                  onClick={() => handleDelete(cat.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
