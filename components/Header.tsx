'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface HeaderProps {
  onAddTransaction: () => void
}

export default function Header({ onAddTransaction }: HeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <h1 className="text-xl font-bold text-white">Finance Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onAddTransaction}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
            >
              <span>+</span>
              <span className="hidden sm:inline">Nova Transação</span>
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-gray-400 hover:text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
