'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Target,
  MoreHorizontal,
  CreditCard,
  PiggyBank,
  TrendingUp,
  CalendarDays,
  Upload,
  Tag,
  Calendar,
  BarChart3,
  Sparkles,
  Settings,
} from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

const mainNavLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transações', icon: ArrowLeftRight },
  { href: '/accounts', label: 'Contas', icon: Wallet },
  { href: '/goals', label: 'Metas', icon: Target },
]

const extraNavLinks = [
  { href: '/credit-cards', label: 'Cartões de Crédito', icon: CreditCard },
  { href: '/budget', label: 'Orçamento', icon: PiggyBank },
  { href: '/net-worth', label: 'Patrimônio', icon: TrendingUp },
  { href: '/calendar', label: 'Calendário', icon: CalendarDays },
  { href: '/categories', label: 'Categorias', icon: Tag },
  { href: '/planning', label: 'Planejamento', icon: Calendar },
  { href: '/import', label: 'Importar Dados', icon: Upload },
  { href: '/reports', label: 'Relatórios', icon: BarChart3 },
  { href: '/insights', label: 'Insights IA', icon: Sparkles },
  { href: '/settings', label: 'Configurações', icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden border-t border-border/50 bg-background/90 backdrop-blur-sm">
      <div className="flex h-16 items-stretch">
        {mainNavLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`)

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-violet-400'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5',
                  isActive ? 'text-violet-400' : 'text-muted-foreground'
                )}
              />
              <span>{label}</span>
            </Link>
          )
        })}

        {/* More button */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors">
              <MoreHorizontal className="h-5 w-5" />
              <span>Mais</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto max-h-[70vh]">
            <SheetHeader className="mb-4">
              <SheetTitle>Navegação</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-3 gap-3 pb-6">
              {extraNavLinks.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(`${href}/`)
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex flex-col items-center justify-center gap-2 p-3 rounded-xl text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-violet-500/10 text-violet-400'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                    )}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-center leading-tight">{label}</span>
                  </Link>
                )
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}
