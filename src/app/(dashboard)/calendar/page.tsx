import { CalendarDays } from 'lucide-react'

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-orange-500/10">
          <CalendarDays className="h-6 w-6 text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Calendário Financeiro</h1>
          <p className="text-muted-foreground text-sm">Visualize suas finanças no calendário</p>
        </div>
      </div>
      <div className="flex items-center justify-center h-64 rounded-xl border border-dashed border-border/50 bg-card/30">
        <div className="text-center space-y-2">
          <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Módulo em desenvolvimento</p>
          <p className="text-xs text-muted-foreground/60">Em breve: visualização mensal, transações por dia e vencimentos</p>
        </div>
      </div>
    </div>
  )
}
