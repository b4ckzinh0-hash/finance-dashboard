import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Transaction = {
  id: string
  user_id: string
  amount: number
  type: 'income' | 'expense'
  category: string
  date: string
  description: string | null
  created_at: string
}

export const CATEGORIES = [
  'Alimentação',
  'Aluguel',
  'Transporte',
  'Lazer',
  'Saúde',
  'Educação',
  'Salário',
  'Freelance',
  'Outros',
]

export const CATEGORY_COLORS: Record<string, string> = {
  Alimentação: '#f97316',
  Aluguel: '#ef4444',
  Transporte: '#3b82f6',
  Lazer: '#a855f7',
  Saúde: '#10b981',
  Educação: '#6366f1',
  Salário: '#22c55e',
  Freelance: '#eab308',
  Outros: '#94a3b8',
}
