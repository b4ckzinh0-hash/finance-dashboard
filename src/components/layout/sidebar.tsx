'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Tag,
  Target,
  Calendar,
  BarChart3,
  Sparkles,
  Settings,
  Building2,
} from 'lucide-react'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transações', icon: ArrowLeftRight },
  { href: '/accounts', label: 'Contas', icon: Wallet },
  { href: '/categories', label: 'Categorias', icon: Tag },
  { href: '/goals', label: 'Metas', icon: Target },
  { href: '/planning', label: 'Planejamento', icon: Calendar },
  { href: '/reports', label: 'Relatórios', icon: BarChart3 },
  { href: '/open-finance', label: 'Open Finance', icon: Building2 },
  { href: '/insights', label: 'Insights IA', icon: Sparkles },
  { href: '/settings', label: 'Configurações', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 flex-col bg-card border-r border-border/50 z-30">
      {/* Logo */}
      <div className="p-6 border-b border-border/50">
        <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
          FinanceApp
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Controle Financeiro</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`)

          return (
            <Link key={href} href={href}>
              <span className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group">
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border border-violet-500/30"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <Icon
                  className={cn(
                    'relative h-4 w-4 shrink-0',
                    isActive
                      ? 'text-violet-400'
                      : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                <span
                  className={cn(
                    'relative',
                    isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground group-hover:text-foreground'
                  )}
                >
                  {label}
                </span>
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border/50">
        <p className="text-xs text-muted-foreground text-center">
          FinanceApp v1.0
        </p>
      </div>
    </aside>
  )
}
