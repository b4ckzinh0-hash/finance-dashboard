/**
 * Simulated Open Finance client.
 *
 * Generates realistic mock data (accounts + transactions) for a connected bank.
 * Uses the BANK_REGISTRY for institution metadata — no changes needed here
 * when new banks are added to the registry.
 */

import { getBankById, type BankInstitution } from './registry'

export interface OpenFinanceAccount {
  id: string
  bankId: string
  bankName: string
  accountNumber: string
  agency: string
  type: 'checking' | 'savings' | 'credit_card' | 'investment'
  balance: number
  currency: 'BRL'
}

export interface OpenFinanceTransaction {
  id: string
  bankId: string
  accountId: string
  date: string        // ISO date string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
}

// ─── Mock data generators ──────────────────────────────────────────────────────

function pad(n: number, len = 2) {
  return String(n).padStart(len, '0')
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function randomDate(daysBack: number): string {
  const d = new Date()
  d.setDate(d.getDate() - Math.floor(randomBetween(0, daysBack)))
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const MOCK_DESCRIPTIONS: { desc: string; type: 'income' | 'expense'; category: string }[] = [
  { desc: 'Salário', type: 'income', category: 'Salário' },
  { desc: 'PIX recebido', type: 'income', category: 'Renda' },
  { desc: 'Supermercado Carrefour', type: 'expense', category: 'Alimentação' },
  { desc: 'iFood pedido', type: 'expense', category: 'Alimentação' },
  { desc: 'Uber viagem', type: 'expense', category: 'Transporte' },
  { desc: 'Combustível Posto Shell', type: 'expense', category: 'Transporte' },
  { desc: 'Netflix assinatura', type: 'expense', category: 'Entretenimento' },
  { desc: 'Spotify Premium', type: 'expense', category: 'Entretenimento' },
  { desc: 'Farmácia Drogasil', type: 'expense', category: 'Saúde' },
  { desc: 'Academia Smart Fit', type: 'expense', category: 'Saúde' },
  { desc: 'Conta de energia', type: 'expense', category: 'Moradia' },
  { desc: 'Aluguel', type: 'expense', category: 'Moradia' },
  { desc: 'Amazon compras', type: 'expense', category: 'Compras' },
  { desc: 'Curso Udemy', type: 'expense', category: 'Educação' },
]

function generateMockTransactions(bankId: string, accountId: string, count: number): OpenFinanceTransaction[] {
  return Array.from({ length: count }, (_, i) => {
    const mock = MOCK_DESCRIPTIONS[Math.floor(Math.random() * MOCK_DESCRIPTIONS.length)]
    return {
      id: `${bankId}-tx-${accountId}-${i}`,
      bankId,
      accountId,
      date: randomDate(60),
      description: mock.desc,
      amount: Math.round(randomBetween(10, mock.type === 'income' ? 8000 : 500) * 100) / 100,
      type: mock.type,
      category: mock.category,
    }
  })
}

function generateMockAccount(bank: BankInstitution, type: OpenFinanceAccount['type']): OpenFinanceAccount {
  const accountId = `${bank.id}-acc-${type}`
  return {
    id: accountId,
    bankId: bank.id,
    bankName: bank.name,
    accountNumber: String(Math.floor(randomBetween(10000, 99999))),
    agency: String(Math.floor(randomBetween(1000, 9999))),
    type,
    balance: Math.round(randomBetween(type === 'investment' ? 1000 : 100, 20000) * 100) / 100,
    currency: 'BRL',
  }
}

// ─── Simulated async API ───────────────────────────────────────────────────────

/** Simulate network delay (150-600ms) */
function delay(ms?: number) {
  return new Promise((r) => setTimeout(r, ms ?? Math.floor(randomBetween(150, 600))))
}

export interface OpenFinanceConnectResult {
  success: boolean
  bank: BankInstitution
  accounts: OpenFinanceAccount[]
  consentId: string
}

/**
 * Simulate connecting a bank and fetching its accounts.
 * In a real implementation, this would redirect to the bank's OAuth flow.
 */
export async function connectBankSimulated(bankId: string): Promise<OpenFinanceConnectResult> {
  await delay()
  const bank = getBankById(bankId)
  if (!bank) throw new Error(`Bank not found: ${bankId}`)

  const accounts: OpenFinanceAccount[] = []

  if (bank.supportedFeatures.includes('accounts')) {
    accounts.push(generateMockAccount(bank, 'checking'))
    accounts.push(generateMockAccount(bank, 'savings'))
  }
  if (bank.supportedFeatures.includes('credit_cards')) {
    accounts.push(generateMockAccount(bank, 'credit_card'))
  }
  if (bank.supportedFeatures.includes('investments')) {
    accounts.push(generateMockAccount(bank, 'investment'))
  }

  return {
    success: true,
    bank,
    accounts,
    consentId: `consent-${bankId}-${Date.now()}`,
  }
}

/**
 * Simulate fetching transactions for a connected account.
 */
export async function fetchBankTransactions(
  bankId: string,
  accountId: string,
  count = 20
): Promise<OpenFinanceTransaction[]> {
  await delay()
  const bank = getBankById(bankId)
  if (!bank) throw new Error(`Bank not found: ${bankId}`)
  return generateMockTransactions(bankId, accountId, count)
}
