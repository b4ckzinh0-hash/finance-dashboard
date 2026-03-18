import ExcelJS from 'exceljs'
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

export async function exportTransactionsToExcel(
  transactions: Transaction[],
  categories: Category[],
  filters?: ExportFilters
): Promise<void> {
  const now = new Date()
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]))

  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0)
  const expenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)
  const balance = income - expenses

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Finance Dashboard'
  workbook.created = now

  // ─── Sheet 1: Resumo ───────────────────────────────────────────────────────
  const summarySheet = workbook.addWorksheet('Resumo')
  summarySheet.columns = [
    { header: '', key: 'label', width: 32 },
    { header: '', key: 'value', width: 22 },
  ]

  summarySheet.addRow(['Finance Dashboard — Relatório Financeiro'])
  summarySheet.addRow(['Período:', filters?.label ?? format(now, 'MMMM yyyy', { locale: ptBR })])
  summarySheet.addRow(['Gerado em:', format(now, "dd/MM/yyyy 'às' HH:mm")])
  summarySheet.addRow([])
  const summaryHeaderRow = summarySheet.addRow(['Métrica', 'Valor (R$)'])
  summaryHeaderRow.font = { bold: true }
  summaryHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6D28D9' } }
  summaryHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  summarySheet.addRow(['Receitas', brl(income)])
  summarySheet.addRow(['Despesas', brl(expenses)])
  summarySheet.addRow(['Saldo', brl(balance)])
  summarySheet.addRow(['Total de transações', transactions.length])

  // ─── Sheet 2: Transações ───────────────────────────────────────────────────
  const txSheet = workbook.addWorksheet('Transações')
  txSheet.columns = [
    { header: 'Data', key: 'date', width: 14 },
    { header: 'Descrição', key: 'desc', width: 32 },
    { header: 'Categoria', key: 'cat', width: 22 },
    { header: 'Tipo', key: 'type', width: 16 },
    { header: 'Método de Pagamento', key: 'method', width: 24 },
    { header: 'Valor (R$)', key: 'amount', width: 16 },
    { header: 'Observações', key: 'notes', width: 32 },
  ]

  const txHeaderRow = txSheet.getRow(1)
  txHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  txHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3F3F46' } }

  transactions.forEach((t) => {
    txSheet.addRow({
      date: format(new Date(t.date), 'dd/MM/yyyy'),
      desc: t.description,
      cat: categoryMap.get(t.category_id ?? '') ?? '—',
      type: t.type === 'income' ? 'Receita' : t.type === 'expense' ? 'Despesa' : 'Transferência',
      method: t.payment_method ?? '—',
      amount: brl(t.amount),
      notes: t.notes ?? '',
    })
  })

  // ─── Sheet 3: Categorias ───────────────────────────────────────────────────
  const catSheet = workbook.addWorksheet('Categorias')
  catSheet.columns = [
    { header: 'Categoria', key: 'name', width: 24 },
    { header: 'Total Gasto (R$)', key: 'amount', width: 20 },
    { header: 'Nº Transações', key: 'count', width: 18 },
    { header: '% das Despesas', key: 'pct', width: 18 },
  ]

  const catHeaderRow = catSheet.getRow(1)
  catHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  catHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3F3F46' } }

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

  Array.from(catTotals.values())
    .sort((a, b) => b.amount - a.amount)
    .forEach((c) => {
      catSheet.addRow({
        name: c.name,
        amount: brl(c.amount),
        count: c.count,
        pct: expenses > 0 ? `${((c.amount / expenses) * 100).toFixed(1)}%` : '0%',
      })
    })

  // ─── Write & download ──────────────────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  const fileName = `relatorio-${format(now, 'yyyy-MM-dd')}.xlsx`
  saveAs(blob, fileName)
}
