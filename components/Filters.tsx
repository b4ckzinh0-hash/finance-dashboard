interface FiltersProps {
  filterMonth: string
  filterCategory: string
  categories: string[]
  onMonthChange: (month: string) => void
  onCategoryChange: (category: string) => void
}

export default function Filters({
  filterMonth,
  filterCategory,
  categories,
  onMonthChange,
  onCategoryChange,
}: FiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex items-center gap-2">
        <label className="text-gray-400 text-sm whitespace-nowrap">📅 Mês:</label>
        <input
          type="month"
          value={filterMonth}
          onChange={(e) => onMonthChange(e.target.value)}
          className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-gray-400 text-sm whitespace-nowrap">🏷️ Categoria:</label>
        <select
          value={filterCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 transition"
        >
          <option value="all">Todas</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
