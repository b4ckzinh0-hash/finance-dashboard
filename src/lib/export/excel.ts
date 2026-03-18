import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Transaction, Category } from '@/types'

function brl(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

interface ExportFilters {
  startDate?: string
  endDate?: string
  label?: string
}

export function exportTransactionsToExcel(
  transactions: Transaction[],
  categories: Category[],
  filters?: ExportFilters
): void {
  const now = new Date()
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]))

  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0)
  const expenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)
  const balance = income - expenses

  // ─── Sheet 1: Resumo ───────────────────────────────────────────────────────
  const summaryData = [
    ['Finance Dashboard — Relatório Financeiro'],
    ['Período:', filters?.label ?? format(now, 'MMMM yyyy', { locale: ptBR })],
    ['Gerado em:', format(now, "dd/MM/yyyy 'às' HH:mm")],
    [],
    ['Métrica', 'Valor (R$)'],
    ['Receitas', income],
    ['Despesas', expenses],
    ['Saldo', balance],
    ['Total de transações', transactions.length],
  ]

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)

  // Style column widths
  summarySheet['!cols'] = [{ wch: 30 }, { wch: 20 }]

  // ─── Sheet 2: Transações ───────────────────────────────────────────────────
  const txHeaders = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Método de Pagamento', 'Valor (R$)', 'Observações']
  const txRows = transactions.map((t) => [
    format(new Date(t.date), 'dd/MM/yyyy'),
    t.description,
    categoryMap.get(t.category_id ?? '') ?? '—',
    t.type === 'income' ? 'Receita' : t.type === 'expense' ? 'Despesa' : 'Transferência',
    t.payment_method ?? '—',
    t.amount,
    t.notes ?? '',
  ])

  const txSheet = XLSX.utils.aoa_to_sheet([txHeaders, ...txRows])
  txSheet['!cols'] = [
    { wch: 12 },
    { wch: 30 },
    { wch: 20 },
    { wch: 14 },
    { wch: 22 },
    { wch: 14 },
    { wch: 30 },
  ]

  // ─── Sheet 3: Categorias ───────────────────────────────────────────────────
  const catTotals = new Map<string, { name: string; amount: number; count: number }>()
  transactions
    .filter((t) => t.type === 'expense' && t.category_id)
    .forEach((t) => {
      const name = categoryMap.get(t.category_id!) ?? 'Outros'
      if (!catTotals.has(t.category_id!)) {
        catTotals.set(t.category_id!, { name, amount: 0, count: 0 })
      }
      const entry = catTotals.get(t.category_id!)!
      entry.amount += t.amount
      entry.count++
    })

  const catHeaders = ['Categoria', 'Total Gasto (R$)', 'Nº Transações', '% das Despesas']
  const catRows = Array.from(catTotals.values())
    .sort((a, b) => b.amount - a.amount)
    .map((c) => [
      c.name,
      c.amount,
      c.count,
      expenses > 0 ? `${((c.amount / expenses) * 100).toFixed(1)}%` : '0%',
    ])

  const catSheet = XLSX.utils.aoa_to_sheet([catHeaders, ...catRows])
  catSheet['!cols'] = [{ wch: 22 }, { wch: 18 }, { wch: 16 }, { wch: 16 }]

  // ─── Workbook ──────────────────────────────────────────────────────────────
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Resumo')
  XLSX.utils.book_append_sheet(wb, txSheet, 'Transações')
  XLSX.utils.book_append_sheet(wb, catSheet, 'Categorias')

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  const fileName = `relatorio-${format(now, 'yyyy-MM-dd')}.xlsx`
  saveAs(blob, fileName)
}
