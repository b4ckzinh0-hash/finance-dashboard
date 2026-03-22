import { TrendingUp } from 'lucide-react'

export default function NetWorthPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-500/10">
          <TrendingUp className="h-6 w-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Patrimônio Líquido</h1>
          <p className="text-muted-foreground text-sm">Acompanhe a evolução do seu patrimônio</p>
        </div>
      </div>
      <div className="flex items-center justify-center h-64 rounded-xl border border-dashed border-border/50 bg-card/30">
        <div className="text-center space-y-2">
          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Módulo em desenvolvimento</p>
          <p className="text-xs text-muted-foreground/60">Em breve: ativos vs passivos, projeções e snapshots mensais</p>
        </div>
      </div>
    </div>
  )
}
