'use client'

import { useState, useCallback } from 'react'
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ParsedTransaction {
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
}

interface ImportFile {
  name: string
  size: number
  status: 'pending' | 'parsing' | 'preview' | 'imported' | 'error'
  transactions?: ParsedTransaction[]
  error?: string
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function parseCSV(content: string): ParsedTransaction[] {
  const lines = content.trim().split('\n')
  if (lines.length < 2) return []

  const transactions: ParsedTransaction[] = []

  const header = lines[0].toLowerCase()
  const isNubank = header.includes('data') && header.includes('descrição') && header.includes('valor')

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    if (cols.length < 3) continue

    try {
      const date = cols[0]
      const description = cols[1]
      const amountStr = cols[2]

      if (isNubank) {
        const amount = parseFloat(amountStr.replace(/[^\d.,-]/g, '').replace(',', '.'))
        if (!isNaN(amount)) {
          transactions.push({
            date,
            description,
            amount: Math.abs(amount),
            type: amount < 0 ? 'expense' : 'income',
          })
        }
      } else {
        const amount = parseFloat(amountStr.replace(/[^\d.,-]/g, '').replace(',', '.'))
        if (!isNaN(amount)) {
          transactions.push({
            date,
            description,
            amount: Math.abs(amount),
            type: amount < 0 ? 'expense' : 'income',
          })
        }
      }
    } catch {
      // Skip malformed rows
    }
  }

  return transactions
}

function parseOFX(content: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = []
  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g
  let match

  while ((match = stmtTrnRegex.exec(content)) !== null) {
    const block = match[1]
    const dateMatch = block.match(/<DTPOSTED>(\d{8})/)
    const amountMatch = block.match(/<TRNAMT>([-\d.]+)/)
    const nameMatch = block.match(/<NAME>(.*?)(?:<|\n)/)
    const memoMatch = block.match(/<MEMO>(.*?)(?:<|\n)/)

    if (dateMatch && amountMatch) {
      const dateStr = dateMatch[1]
      const date = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
      const amount = parseFloat(amountMatch[1])
      const description = (nameMatch?.[1] || memoMatch?.[1] || 'Transação').trim()

      transactions.push({
        date,
        description,
        amount: Math.abs(amount),
        type: amount < 0 ? 'expense' : 'income',
      })
    }
  }

  return transactions
}

export default function ImportPage() {
  const [files, setFiles] = useState<ImportFile[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const processFile = useCallback(async (file: File) => {
    setFiles(prev => prev.map(f =>
      f.name === file.name ? { ...f, status: 'parsing' } : f
    ))

    try {
      const content = await file.text()
      let transactions: ParsedTransaction[] = []

      if (file.name.toLowerCase().endsWith('.ofx') || file.name.toLowerCase().endsWith('.qfx')) {
        transactions = parseOFX(content)
      } else if (file.name.toLowerCase().endsWith('.csv')) {
        transactions = parseCSV(content)
      } else {
        throw new Error('Formato não suportado. Use OFX, QFX ou CSV.')
      }

      if (transactions.length === 0) {
        throw new Error('Nenhuma transação encontrada no arquivo.')
      }

      setFiles(prev => prev.map(f =>
        f.name === file.name ? { ...f, status: 'preview', transactions } : f
      ))
    } catch (err) {
      setFiles(prev => prev.map(f =>
        f.name === file.name ? { ...f, status: 'error', error: (err as Error).message } : f
      ))
    }
  }, [])

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return
    const newFiles: ImportFile[] = []

    Array.from(fileList).forEach(file => {
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (!['csv', 'ofx', 'qfx'].includes(ext || '')) return

      if (files.find(f => f.name === file.name)) return

      newFiles.push({
        name: file.name,
        size: file.size,
        status: 'pending',
      })

      // Delay to allow React state update to complete before parsing begins
      const FILE_PARSE_DELAY_MS = 100
      setTimeout(() => processFile(file), FILE_PARSE_DELAY_MS)
    })

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles])
    }
  }, [files, processFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const removeFile = (name: string) => {
    setFiles(prev => prev.filter(f => f.name !== name))
  }

  const totalTransactions = files.reduce((sum, f) => sum + (f.transactions?.length || 0), 0)
  const previewFiles = files.filter(f => f.status === 'preview')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-violet-500/10">
          <Upload className="h-6 w-6 text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Importar Dados</h1>
          <p className="text-muted-foreground text-sm">Importe extratos bancários em OFX ou CSV</p>
        </div>
      </div>

      {/* Supported formats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { format: 'OFX / QFX', desc: 'Padrão bancário universal', color: 'text-violet-400', bg: 'bg-violet-500/10' },
          { format: 'CSV', desc: 'Nubank, Inter, C6, Itaú…', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { format: 'PDF', desc: 'Em breve', color: 'text-muted-foreground', bg: 'bg-muted/20' },
        ].map(item => (
          <Card key={item.format} className="bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className={cn('text-sm font-semibold', item.color)}>{item.format}</div>
              <div className="text-xs text-muted-foreground mt-1">{item.desc}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'relative flex flex-col items-center justify-center gap-3 p-12 rounded-xl border-2 border-dashed transition-all cursor-pointer',
          isDragging
            ? 'border-violet-500 bg-violet-500/5'
            : 'border-border/50 bg-card/30 hover:border-violet-500/50 hover:bg-card/50'
        )}
        onClick={() => {
          const input = document.createElement('input')
          input.type = 'file'
          input.multiple = true
          input.accept = '.csv,.ofx,.qfx'
          input.onchange = (e) => {
            handleFiles((e.target as HTMLInputElement).files)
            input.remove()
          }
          document.body.appendChild(input)
          input.click()
        }}
      >
        <Upload className={cn('h-10 w-10 transition-colors', isDragging ? 'text-violet-400' : 'text-muted-foreground')} />
        <div className="text-center">
          <p className="text-sm font-medium">Arraste arquivos aqui ou clique para selecionar</p>
          <p className="text-xs text-muted-foreground mt-1">Suporte a OFX, QFX e CSV</p>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-3">
          {files.map(file => (
            <Card key={file.name} className="bg-card/50 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {file.status === 'parsing' && <Loader2 className="h-4 w-4 animate-spin text-violet-400" />}
                    {file.status === 'preview' && (
                      <Badge variant="outline" className="text-emerald-400 border-emerald-400/30">
                        {file.transactions?.length} transações
                      </Badge>
                    )}
                    {file.status === 'error' && <AlertCircle className="h-4 w-4 text-red-400" />}
                    {file.status === 'imported' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                    <button onClick={() => removeFile(file.name)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {file.status === 'error' && (
                  <p className="text-xs text-red-400 mt-2">{file.error}</p>
                )}
                {file.status === 'preview' && file.transactions && file.transactions.length > 0 && (
                  <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
                    {file.transactions.slice(0, 5).map((t, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-muted/20">
                        <span className="text-muted-foreground">{t.date}</span>
                        <span className="truncate mx-2 max-w-[200px]">{t.description}</span>
                        <span className={t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}>
                          {t.type === 'income' ? '+' : '-'}R$ {t.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {file.transactions.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center py-1">
                        e mais {file.transactions.length - 5} transações…
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {previewFiles.length > 0 && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <p className="text-sm">
                <span className="font-semibold text-violet-400">{totalTransactions} transações</span>
                {' '}prontas para importar
              </p>
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700">
                <Upload className="h-4 w-4 mr-2" />
                Importar Tudo
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
