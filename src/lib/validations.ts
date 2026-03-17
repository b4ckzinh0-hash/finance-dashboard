import { z } from 'zod'

// ============================================================
// Auth schemas
// ============================================================
export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
})
export type LoginFormValues = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
})
export type RegisterFormValues = z.infer<typeof registerSchema>

// ============================================================
// Transaction schema
// ============================================================
export const transactionSchema = z.object({
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z
    .number({ invalid_type_error: 'Informe um valor' })
    .positive('O valor deve ser positivo'),
  description: z.string().min(1, 'Descrição obrigatória'),
  category_id: z.string().uuid('Categoria inválida'),
  account_id: z.string().uuid('Conta inválida'),
  date: z.string().min(1, 'Data obrigatória'),
  payment_method: z.enum([
    'pix',
    'credit_card',
    'debit_card',
    'cash',
    'bank_transfer',
    'boleto',
    'other',
  ]),
  notes: z.string().optional(),
  is_recurring: z.boolean().optional().default(false),
})
export type TransactionFormValues = z.infer<typeof transactionSchema>

// ============================================================
// Account schema
// ============================================================
export const accountSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  type: z.enum(['checking', 'savings', 'credit_card', 'investment', 'cash', 'other']),
  balance: z.number({ invalid_type_error: 'Informe um saldo inicial' }),
  color: z.string().min(1, 'Cor obrigatória'),
  icon: z.string().min(1, 'Ícone obrigatório'),
})
export type AccountFormValues = z.infer<typeof accountSchema>

// ============================================================
// Category schema
// ============================================================
export const categorySchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  type: z.enum(['income', 'expense']),
  icon: z.string().min(1, 'Ícone obrigatório'),
  color: z.string().min(1, 'Cor obrigatória'),
})
export type CategoryFormValues = z.infer<typeof categorySchema>

// ============================================================
// Goal schema
// ============================================================
export const goalSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  target_amount: z
    .number({ invalid_type_error: 'Informe o valor alvo' })
    .positive('O valor deve ser positivo'),
  deadline: z.string().optional(),
  icon: z.string().min(1, 'Ícone obrigatório'),
  color: z.string().min(1, 'Cor obrigatória'),
})
export type GoalFormValues = z.infer<typeof goalSchema>

// ============================================================
// Recurring expense schema
// ============================================================
export const recurringExpenseSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  amount: z
    .number({ invalid_type_error: 'Informe um valor' })
    .positive('O valor deve ser positivo'),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  next_due_date: z.string().min(1, 'Data obrigatória'),
  category_id: z.string().uuid('Categoria inválida'),
  account_id: z.string().uuid('Conta inválida'),
})
export type RecurringExpenseFormValues = z.infer<typeof recurringExpenseSchema>
