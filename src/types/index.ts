// ============================================================
// Domain types
// ============================================================

export type AccountType =
  | 'checking'
  | 'savings'
  | 'credit_card'
  | 'investment'
  | 'cash'
  | 'other'

export type TransactionType = 'income' | 'expense' | 'transfer'

export type PaymentMethod =
  | 'pix'
  | 'credit_card'
  | 'debit_card'
  | 'cash'
  | 'bank_transfer'
  | 'boleto'
  | 'other'

export type GoalStatus = 'active' | 'completed' | 'cancelled'

export type NotificationType = 'info' | 'warning' | 'success' | 'error'

export type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'yearly'

export type CategoryType = 'income' | 'expense'

// ============================================================
// Database row interfaces
// ============================================================

export interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
  currency: string
  created_at: string
  updated_at: string
}

export interface Account {
  id: string
  user_id: string
  name: string
  type: AccountType
  balance: number
  color: string
  icon: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  type: CategoryType
  icon: string
  color: string
  is_default: boolean
  parent_id: string | null
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  account_id: string
  category_id: string
  type: TransactionType
  amount: number
  description: string
  date: string
  payment_method: PaymentMethod
  notes: string | null
  is_recurring: boolean
  recurring_id: string | null
  created_at: string
  updated_at: string
  // Joined relations (optional, populated via select)
  account?: Account
  category?: Category
}

export interface Goal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  deadline: string | null
  icon: string
  color: string
  status: GoalStatus
  created_at: string
  updated_at: string
}

export interface RecurringExpense {
  id: string
  user_id: string
  account_id: string
  category_id: string
  name: string
  amount: number
  frequency: FrequencyType
  next_due_date: string
  is_active: boolean
  created_at: string
  // Joined relations (optional)
  account?: Account
  category?: Category
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  is_read: boolean
  created_at: string
}

// ============================================================
// Utility / form types
// ============================================================

export interface TransactionFilters {
  type?: TransactionType
  category_id?: string
  account_id?: string
  date_from?: string
  date_to?: string
  search?: string
}

export interface MonthlySummary {
  month: number
  year: number
  income: number
  expenses: number
  balance: number
}

export interface CategorySummary {
  category: Category
  total: number
  count: number
  percentage: number
}
