'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTransactions } from '@/hooks/use-transactions'
import { useCategories } from '@/hooks/use-categories'
import { useAiCategorize } from '@/hooks/use-ai-categorize'
import { useToast } from '@/components/ui/use-toast'

export function AutoCategorizeButton() {
  const [loading, setLoading] = useState(false)
  const { transactions, updateTransaction } = useTransactions()
  const { categories } = useCategories()
  const { suggest } = useAiCategorize()
  const { toast } = useToast()

  const handleAutoCategorize = async () => {
    const uncategorized = transactions.filter((t) => !t.category_id && t.type !== 'transfer')
    if (uncategorized.length === 0) {
      toast({ title: 'Nenhuma transação sem categoria.', description: 'Todas as transações já têm categoria.' })
      return
    }

    setLoading(true)
    let categorized = 0

    for (const tx of uncategorized) {
      const suggestion = suggest(tx.description)
      if (!suggestion) continue

      // Find matching category by name (case-insensitive)
      const matched = categories.find(
        (c) => c.name.toLowerCase() === suggestion.categoryName.toLowerCase()
      )
      if (!matched) continue

      try {
        await updateTransaction(tx.id, { category_id: matched.id })
        categorized++
      } catch {
        // continue with remaining transactions
      }
    }

    setLoading(false)
    toast({
      title: `🤖 Auto-categorização concluída`,
      description: `${categorized} de ${uncategorized.length} transação(ões) categorizada(s).`,
    })
  }

  const uncategorizedCount = transactions.filter(
    (t) => !t.category_id && t.type !== 'transfer'
  ).length

  return (
    <Button
      size="sm"
      variant="outline"
      className="border-zinc-700 text-zinc-300 hover:text-white gap-2"
      disabled={loading || uncategorizedCount === 0}
      onClick={handleAutoCategorize}
      title={`${uncategorizedCount} transação(ões) sem categoria`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4 text-violet-400" />
      )}
      Auto-categorizar
      {uncategorizedCount > 0 && (
        <span className="ml-1 rounded-full bg-violet-600 px-1.5 text-[10px] font-bold text-white">
          {uncategorizedCount}
        </span>
      )}
    </Button>
  )
}
