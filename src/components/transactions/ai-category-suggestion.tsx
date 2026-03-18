'use client'

import { Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { CategorySuggestion } from '@/lib/ai/categorize'

interface AiCategorySuggestionProps {
  suggestion: CategorySuggestion | null
  onAccept: (categoryName: string) => void
}

function confidenceColor(confidence: number): string {
  if (confidence >= 90) return 'text-emerald-400 border-emerald-800'
  if (confidence >= 70) return 'text-yellow-400 border-yellow-800'
  return 'text-zinc-400 border-zinc-700'
}

export function AiCategorySuggestion({ suggestion, onAccept }: AiCategorySuggestionProps) {
  if (!suggestion) return null

  return (
    <div className="flex items-center gap-2 rounded-lg border border-violet-800/40 bg-violet-950/20 px-3 py-2">
      <Sparkles className="h-3.5 w-3.5 text-violet-400 flex-shrink-0" />
      <span className="text-xs text-zinc-300">
        Sugestão IA:{' '}
        <span className="font-medium text-violet-300">{suggestion.categoryName}</span>
      </span>
      <Badge
        variant="outline"
        className={`text-[10px] ml-auto ${confidenceColor(suggestion.confidence)}`}
      >
        {suggestion.confidence}%
      </Badge>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-6 px-2 text-[10px] text-violet-400 hover:text-violet-300"
        onClick={() => onAccept(suggestion.categoryName)}
      >
        Usar
      </Button>
    </div>
  )
}
