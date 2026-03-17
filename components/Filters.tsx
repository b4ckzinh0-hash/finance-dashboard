'use client'

import { CATEGORIES } from '@/lib/supabase'

interface FiltersProps {
  selectedMonth: string
  selectedCategory: string
  onMonthChange: (month: string) => void
  onCategoryChange: (category: string) => void
}

function generateMonthOptions() {
  const options: { value: string; label: string }[] = []
  const now = new Date()

  const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril',
    'Maio', 'Junho', 'Julho', 'Agosto',
    'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ]

  // Current year + previous year
  for (let y = now.getFullYear(); y >= now.getFullYear() - 1; y--) {
    const maxMonth = y === now.getFullYear() ? now.getMonth() : 11
    for (let m = maxMonth; m >= 0; m--) {
      const value = `${y}-${String(m + 1).padStart(2, '0')}`
      const label = `${MONTHS[m]} ${y}`
      options.push({ value, label })
    }
  }

  return options
}

export default function Filters({
  selectedMonth,
  selectedCategory,
  onMonthChange,
  onCategoryChange,
}: FiltersProps) {
  const monthOptions = generateMonthOptions()

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
          />
        </svg>
        <span className="font-medium">Filtros:</span>
      </div>

      {/* Month filter */}
      <div className="relative">
        <select
          value={selectedMonth}
          onChange={(e) => onMonthChange(e.target.value)}
          className="pl-3 pr-8 py-2 text-sm bg-gray-800 border border-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer transition hover:bg-gray-700"
        >
          {monthOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Category filter */}
      <div className="relative">
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="pl-3 pr-8 py-2 text-sm bg-gray-800 border border-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer transition hover:bg-gray-700"
        >
          <option value="Todas">Todas as categorias</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Reset button */}
      {selectedCategory !== 'Todas' && (
        <button
          onClick={() => onCategoryChange('Todas')}
          className="flex items-center gap-1 px-3 py-2 text-xs text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl transition"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Limpar
        </button>
      )}
    </div>
  )
}
