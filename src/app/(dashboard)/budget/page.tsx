import { PiggyBank } from 'lucide-react'

export default function BudgetPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-emerald-500/10">
          <PiggyBank className="h-6 w-6 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Orçamento</h1>
          <p className="text-muted-foreground text-sm">Defina e acompanhe limites por categoria</p>
        </div>
      </div>
      <div className="flex items-center justify-center h-64 rounded-xl border border-dashed border-border/50 bg-card/30">
        <div className="text-center space-y-2">
          <PiggyBank className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Módulo em desenvolvimento</p>
          <p className="text-xs text-muted-foreground/60">Em breve: orçamento por categoria, alertas e rollover</p>
        </div>
      </div>
    </div>
  )
}
