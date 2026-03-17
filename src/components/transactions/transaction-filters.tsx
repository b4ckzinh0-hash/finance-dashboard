"use client"

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useCategories } from '@/hooks/use-categories'
import { useAccounts } from '@/hooks/use-accounts'
import {
  startOfMonth,
  endOfMonth,
  startOfYear,
  subMonths,
  format,
} from 'date-fns'

type DateRangePreset = 'este_mes' | 'ultimo_mes' | 'ultimos_3_meses' | 'este_ano' | 'custom'

function getDateRange(preset: DateRangePreset): { from: string; to: string } | null {
  const now = new Date()
  switch (preset) {
    case 'este_mes':
      return {
        from: format(startOfMonth(now), 'yyyy-MM-dd'),
        to: format(endOfMonth(now), 'yyyy-MM-dd'),
      }
    case 'ultimo_mes': {
      const lastMonth = subMonths(now, 1)
      return {
        from: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
        to: format(endOfMonth(lastMonth), 'yyyy-MM-dd'),
      }
    }
    case 'ultimos_3_meses':
      return {
        from: format(startOfMonth(subMonths(now, 2)), 'yyyy-MM-dd'),
        to: format(endOfMonth(now), 'yyyy-MM-dd'),
      }
    case 'este_ano':
      return {
        from: format(startOfYear(now), 'yyyy-MM-dd'),
        to: format(endOfMonth(now), 'yyyy-MM-dd'),
      }
    default:
      return null
  }
}

export function TransactionFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const { categories } = useCategories()
  const { accounts } = useAccounts()

  const [searchValue, setSearchValue] = useState(searchParams.get('search') ?? '')
  const SEARCH_DEBOUNCE_MS = 300
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page')
      router.replace(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  // Debounced search
  useEffect(() => {
    if (debounceTimer) clearTimeout(debounceTimer)
    const timer = setTimeout(() => {
      updateParam('search', searchValue || null)
    }, SEARCH_DEBOUNCE_MS)
    setDebounceTimer(timer)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue])

  const handleDatePreset = (preset: string) => {
    if (preset === 'all') {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('date_preset')
      params.delete('date_from')
      params.delete('date_to')
      params.delete('page')
      router.replace(`${pathname}?${params.toString()}`)
      return
    }
    const range = getDateRange(preset as DateRangePreset)
    const params = new URLSearchParams(searchParams.toString())
    params.set('date_preset', preset)
    if (range) {
      params.set('date_from', range.from)
      params.set('date_to', range.to)
    }
    params.delete('page')
    router.replace(`${pathname}?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearchValue('')
    router.replace(pathname)
  }

  const activeFilterCount = [
    searchParams.get('search'),
    searchParams.get('type'),
    searchParams.get('date_preset'),
    searchParams.get('category_id'),
    searchParams.get('account_id'),
  ].filter(Boolean).length

  const currentType = searchParams.get('type') ?? 'all'
  const currentDatePreset = searchParams.get('date_preset') ?? 'all'
  const currentCategory = searchParams.get('category_id') ?? 'all'
  const currentAccount = searchParams.get('account_id') ?? 'all'

  return (
    <div className="bg-card border rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <SlidersHorizontal className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-medium">Filtros</span>
        {activeFilterCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {activeFilterCount} ativo{activeFilterCount !== 1 ? 's' : ''}
          </Badge>
        )}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-7 text-xs"
            onClick={clearFilters}
          >
            <X className="w-3 h-3 mr-1" />
            Limpar filtros
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar transações..."
            className="pl-9 h-9 text-sm"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          {searchValue && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchValue('')}
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Date range */}
        <Select value={currentDatePreset} onValueChange={handleDatePreset}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os períodos</SelectItem>
            <SelectItem value="este_mes">Este mês</SelectItem>
            <SelectItem value="ultimo_mes">Último mês</SelectItem>
            <SelectItem value="ultimos_3_meses">Últimos 3 meses</SelectItem>
            <SelectItem value="este_ano">Este ano</SelectItem>
          </SelectContent>
        </Select>

        {/* Type */}
        <Select value={currentType} onValueChange={(v) => updateParam('type', v)}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="income">Receitas</SelectItem>
            <SelectItem value="expense">Despesas</SelectItem>
            <SelectItem value="transfer">Transferências</SelectItem>
          </SelectContent>
        </Select>

        {/* Category */}
        <Select value={currentCategory} onValueChange={(v) => updateParam('category_id', v)}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <span className="flex items-center gap-2">
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Account */}
        <Select value={currentAccount} onValueChange={(v) => updateParam('account_id', v)}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Conta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as contas</SelectItem>
            {accounts.map((acc) => (
              <SelectItem key={acc.id} value={acc.id}>
                {acc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
