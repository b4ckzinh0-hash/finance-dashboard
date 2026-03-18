import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
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

export function exportTransactionsToPDF(
  transactions: Transaction[],
  categories: Category[],
  filters?: ExportFilters
): void {
  const doc = new jsPDF()
  const now = new Date()
  const dateLabel =
    filters?.label ??
    `${format(now, 'MMMM yyyy', { locale: ptBR })}`

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]))

  // ─── Header ────────────────────────────────────────────────────────────────
  doc.setFillColor(109, 40, 217) // violet-700
  doc.rect(0, 0, 210, 30, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Finance Dashboard', 14, 18)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Relatório Financeiro — ${dateLabel}`, 14, 25)

  doc.setTextColor(0, 0, 0)

  // ─── Summary section ───────────────────────────────────────────────────────
  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0)
  const expenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0)
  const balance = income - expenses

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Resumo', 14, 42)

  autoTable(doc, {
    startY: 46,
    head: [['Receitas', 'Despesas', 'Saldo']],
    body: [[brl(income), brl(expenses), brl(balance)]],
    headStyles: { fillColor: [109, 40, 217] },
    columnStyles: {
      0: { textColor: [34, 197, 94] },
      1: { textColor: [239, 68, 68] },
      2: { textColor: balance >= 0 ? [109, 40, 217] : [239, 68, 68] },
    },
    styles: { fontStyle: 'bold', fontSize: 11 },
    margin: { left: 14, right: 14 },
  })

  // ─── Transaction table ─────────────────────────────────────────────────────
  const afterSummary = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Transações', 14, afterSummary)

  const rows = transactions.map((t) => [
    format(new Date(t.date), 'dd/MM/yyyy'),
    t.description,
    categoryMap.get(t.category_id ?? '') ?? '—',
    t.type === 'income' ? 'Receita' : t.type === 'expense' ? 'Despesa' : 'Transferência',
    brl(t.amount),
  ])

  autoTable(doc, {
    startY: afterSummary + 4,
    head: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']],
    body: rows,
    headStyles: { fillColor: [63, 63, 70] },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    styles: { fontSize: 9, overflow: 'linebreak' },
    columnStyles: { 4: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  })

  // ─── Category breakdown ────────────────────────────────────────────────────
  const afterTxTable = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  const catTotals = new Map<string, { name: string; amount: number }>()
  transactions
    .filter((t) => t.type === 'expense' && t.category_id)
    .forEach((t) => {
      const name = categoryMap.get(t.category_id!) ?? 'Outros'
      if (!catTotals.has(t.category_id!)) catTotals.set(t.category_id!, { name, amount: 0 })
      catTotals.get(t.category_id!)!.amount += t.amount
    })

  const catRows = Array.from(catTotals.values())
    .sort((a, b) => b.amount - a.amount)
    .map((c) => [c.name, brl(c.amount), expenses > 0 ? `${((c.amount / expenses) * 100).toFixed(1)}%` : '0%'])

  if (catRows.length > 0) {
    // Check if we need a new page
    if (afterTxTable > 240) {
      doc.addPage()
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.text('Gastos por Categoria', 14, 20)
      autoTable(doc, {
        startY: 24,
        head: [['Categoria', 'Total', '% das Despesas']],
        body: catRows,
        headStyles: { fillColor: [63, 63, 70] },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        styles: { fontSize: 9 },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
        margin: { left: 14, right: 14 },
      })
    } else {
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.text('Gastos por Categoria', 14, afterTxTable)
      autoTable(doc, {
        startY: afterTxTable + 4,
        head: [['Categoria', 'Total', '% das Despesas']],
        body: catRows,
        headStyles: { fillColor: [63, 63, 70] },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        styles: { fontSize: 9 },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
        margin: { left: 14, right: 14 },
      })
    }
  }

  // ─── Footer ────────────────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Gerado em ${format(now, "dd/MM/yyyy 'às' HH:mm")} — Finance Dashboard`,
      14,
      doc.internal.pageSize.height - 8
    )
    doc.text(`Página ${i} de ${pageCount}`, 196, doc.internal.pageSize.height - 8, { align: 'right' })
  }

  const fileName = `relatorio-${format(now, 'yyyy-MM-dd')}.pdf`
  doc.save(fileName)
}
