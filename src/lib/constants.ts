import type { AccountType, CategoryType, FrequencyType, PaymentMethod } from '@/types'

// ============================================================
// Default categories
// ============================================================
export const DEFAULT_CATEGORIES: {
  name: string
  icon: string
  color: string
  type: CategoryType
}[] = [
  // Expense
  { name: 'Alimentação',   icon: '🍔', color: '#EF4444', type: 'expense' },
  { name: 'Moradia',       icon: '🏠', color: '#F97316', type: 'expense' },
  { name: 'Transporte',    icon: '🚗', color: '#EAB308', type: 'expense' },
  { name: 'Educação',      icon: '📚', color: '#3B82F6', type: 'expense' },
  { name: 'Saúde',         icon: '🏥', color: '#EC4899', type: 'expense' },
  { name: 'Lazer',         icon: '🎮', color: '#8B5CF6', type: 'expense' },
  { name: 'Vestuário',     icon: '👗', color: '#F43F5E', type: 'expense' },
  { name: 'Contas',        icon: '📋', color: '#6B7280', type: 'expense' },
  { name: 'Compras',       icon: '🛒', color: '#10B981', type: 'expense' },
  { name: 'Assinaturas',   icon: '📱', color: '#06B6D4', type: 'expense' },
  { name: 'Pets',          icon: '🐾', color: '#84CC16', type: 'expense' },
  { name: 'Beleza',        icon: '💄', color: '#D946EF', type: 'expense' },
  { name: 'Outros',        icon: '📦', color: '#9CA3AF', type: 'expense' },
  // Income
  { name: 'Salário',       icon: '💰', color: '#22C55E', type: 'income'  },
  { name: 'Freelance',     icon: '💻', color: '#0EA5E9', type: 'income'  },
  { name: 'Investimentos', icon: '📈', color: '#A855F7', type: 'income'  },
  { name: 'Presentes',     icon: '🎁', color: '#F59E0B', type: 'income'  },
  { name: 'Outros',        icon: '➕', color: '#9CA3AF', type: 'income'  },
]

// ============================================================
// Account types
// ============================================================
export const ACCOUNT_TYPES: { value: AccountType; label: string; icon: string }[] = [
  { value: 'checking',    label: 'Conta Corrente',  icon: '🏦' },
  { value: 'savings',     label: 'Poupança',        icon: '🐷' },
  { value: 'credit_card', label: 'Cartão de Crédito', icon: '💳' },
  { value: 'investment',  label: 'Investimento',    icon: '📈' },
  { value: 'cash',        label: 'Dinheiro',        icon: '💵' },
  { value: 'other',       label: 'Outro',           icon: '📂' },
]

// ============================================================
// Payment methods
// ============================================================
export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'pix',           label: 'Pix'              },
  { value: 'credit_card',   label: 'Cartão de Crédito' },
  { value: 'debit_card',    label: 'Cartão de Débito'  },
  { value: 'cash',          label: 'Dinheiro'          },
  { value: 'bank_transfer', label: 'Transferência'     },
  { value: 'boleto',        label: 'Boleto'            },
  { value: 'other',         label: 'Outro'             },
]

// ============================================================
// Frequency options
// ============================================================
export const FREQUENCY_OPTIONS: { value: FrequencyType; label: string }[] = [
  { value: 'daily',   label: 'Diário'   },
  { value: 'weekly',  label: 'Semanal'  },
  { value: 'monthly', label: 'Mensal'   },
  { value: 'yearly',  label: 'Anual'    },
]

// ============================================================
// Category color palette
// ============================================================
export const CATEGORY_COLORS: string[] = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#10B981',
  '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899', '#F43F5E',
  '#D946EF', '#A855F7', '#0EA5E9', '#84CC16', '#F59E0B',
  '#6B7280', '#9CA3AF', '#374151',
]
