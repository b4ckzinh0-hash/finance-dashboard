'use client'

import { FileText, FileSpreadsheet, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useExport } from '@/hooks/use-export'

interface ExportButtonsProps {
  filters?: { startDate?: string; endDate?: string; label?: string }
}

export function ExportButtons({ filters }: ExportButtonsProps) {
  const { exportToPDF, exportToExcel, exporting } = useExport()

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        className="border-zinc-700 text-zinc-300 hover:text-white gap-2"
        disabled={exporting !== null}
        onClick={() => exportToPDF(filters)}
      >
        {exporting === 'pdf' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4 text-red-400" />
        )}
        Exportar PDF
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="border-zinc-700 text-zinc-300 hover:text-white gap-2"
        disabled={exporting !== null}
        onClick={() => exportToExcel(filters)}
      >
        {exporting === 'excel' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
        )}
        Exportar Excel
      </Button>
    </div>
  )
}
