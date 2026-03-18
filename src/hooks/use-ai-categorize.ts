'use client'

import { useCallback } from 'react'
import { suggestCategory, trainFromCorrection, bulkSuggestCategories } from '@/lib/ai/categorize'
import type { CategorySuggestion } from '@/lib/ai/categorize'

export function useAiCategorize() {
  const suggest = useCallback(
    (description: string): CategorySuggestion | null => suggestCategory(description),
    []
  )

  const train = useCallback(
    (description: string, correctCategory: string): void =>
      trainFromCorrection(description, correctCategory),
    []
  )

  const bulkSuggest = useCallback(
    (descriptions: string[]): (CategorySuggestion | null)[] =>
      bulkSuggestCategories(descriptions),
    []
  )

  return { suggest, train, bulkSuggest }
}
