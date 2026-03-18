'use client'

import { useCallback, useState } from 'react'
import { exportTransactionsToPDF } from '@/lib/export/pdf'
import { exportTransactionsToExcel } from '@/lib/export/excel'
import { useTransactions } from './use-transactions'
import { useCategories } from './use-categories'
import { useToast } from '@/components/ui/use-toast'

export function useExport() {
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null)
  const { transactions } = useTransactions()
  const { categories } = useCategories()
  const { toast } = useToast()

  const exportToPDF = useCallback(
    async (filters?: { startDate?: string; endDate?: string; label?: string }) => {
      setExporting('pdf')
      try {
        let txs = transactions
        if (filters?.startDate) {
          txs = txs.filter((t) => t.date >= filters.startDate!)
        }
        if (filters?.endDate) {
          txs = txs.filter((t) => t.date <= filters.endDate!)
        }
        exportTransactionsToPDF(txs, categories, filters)
        toast({ title: '✅ PDF exportado com sucesso!' })
      } catch (err) {
        console.error(err)
        toast({ title: 'Erro ao exportar PDF', variant: 'destructive' })
      } finally {
        setExporting(null)
      }
    },
    [transactions, categories, toast]
  )

  const exportToExcel = useCallback(
    async (filters?: { startDate?: string; endDate?: string; label?: string }) => {
      setExporting('excel')
      try {
        let txs = transactions
        if (filters?.startDate) {
          txs = txs.filter((t) => t.date >= filters.startDate!)
        }
        if (filters?.endDate) {
          txs = txs.filter((t) => t.date <= filters.endDate!)
        }
        exportTransactionsToExcel(txs, categories, filters)
        toast({ title: '✅ Excel exportado com sucesso!' })
      } catch (err) {
        console.error(err)
        toast({ title: 'Erro ao exportar Excel', variant: 'destructive' })
      } finally {
        setExporting(null)
      }
    },
    [transactions, categories, toast]
  )

  return { exportToPDF, exportToExcel, exporting }
}
