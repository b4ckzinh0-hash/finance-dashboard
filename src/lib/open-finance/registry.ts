// ============================================================
// 🏦 BANK REGISTRY — To add a new bank, simply add a new entry
// to the BANK_REGISTRY array below. No other changes needed!
// ============================================================

export interface BankInstitution {
  id: string
  name: string
  code: string        // ISPB or COMPE code
  color: string       // Brand color (hex)
  logo: string        // Emoji or icon identifier
  primaryColor: string
  supportedFeatures: ('accounts' | 'transactions' | 'credit_cards' | 'investments')[]
}

export const BANK_REGISTRY: BankInstitution[] = [
  {
    id: 'bb',
    name: 'Banco do Brasil',
    code: '001',
    color: '#FFEF00',
    logo: '🟡',
    primaryColor: '#FFEF00',
    supportedFeatures: ['accounts', 'transactions'],
  },
  {
    id: 'itau',
    name: 'Itaú Unibanco',
    code: '341',
    color: '#FF6600',
    logo: '🟠',
    primaryColor: '#FF6600',
    supportedFeatures: ['accounts', 'transactions', 'credit_cards'],
  },
  {
    id: 'bradesco',
    name: 'Bradesco',
    code: '237',
    color: '#CC092F',
    logo: '🔴',
    primaryColor: '#CC092F',
    supportedFeatures: ['accounts', 'transactions'],
  },
  {
    id: 'nubank',
    name: 'Nubank',
    code: '260',
    color: '#8A05BE',
    logo: '💜',
    primaryColor: '#8A05BE',
    supportedFeatures: ['accounts', 'transactions', 'credit_cards'],
  },
  {
    id: 'santander',
    name: 'Santander',
    code: '033',
    color: '#EC0000',
    logo: '🔴',
    primaryColor: '#EC0000',
    supportedFeatures: ['accounts', 'transactions'],
  },
  {
    id: 'caixa',
    name: 'Caixa Econômica',
    code: '104',
    color: '#005CA9',
    logo: '🔵',
    primaryColor: '#005CA9',
    supportedFeatures: ['accounts', 'transactions'],
  },
  {
    id: 'c6',
    name: 'C6 Bank',
    code: '336',
    color: '#1A1A1A',
    logo: '⚫',
    primaryColor: '#1A1A1A',
    supportedFeatures: ['accounts', 'transactions', 'credit_cards', 'investments'],
  },
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    code: '323',
    color: '#009EE3',
    logo: '🔵',
    primaryColor: '#009EE3',
    supportedFeatures: ['accounts', 'transactions'],
  },
]

// ─── Helper functions ──────────────────────────────────────────────────────────

/** Get a bank by its ID. Returns undefined if not found. */
export function getBankById(id: string): BankInstitution | undefined {
  return BANK_REGISTRY.find((b) => b.id === id)
}

/** Get all registered banks. */
export function getAllBanks(): BankInstitution[] {
  return BANK_REGISTRY
}

/** Get all banks that support a given feature. */
export function getBanksByFeature(
  feature: BankInstitution['supportedFeatures'][number]
): BankInstitution[] {
  return BANK_REGISTRY.filter((b) => b.supportedFeatures.includes(feature))
}
