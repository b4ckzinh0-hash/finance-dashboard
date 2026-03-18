/**
 * TypeScript interfaces for the Belvo REST API.
 * Safe to import from both client and server code (no side-effects).
 * Reference: https://developers.belvo.com/reference
 */

export type BelvoLinkStatus =
  | 'valid'
  | 'invalid'
  | 'token_required'
  | 'unconfirmed'
  | 'login_error'
  | 'suspended'

export interface BelvoInstitution {
  name: string
  type: 'bank' | 'fiscal' | 'employment'
  country_codes?: string[]
  display_name?: string
  logo?: string
  icon_logo?: string
  text_logo?: string
  primary_color?: string
  website?: string
}

export interface BelvoLink {
  id: string
  institution: string
  access_mode: 'single' | 'recurrent'
  last_accessed_at: string | null
  created_at: string
  status: BelvoLinkStatus
  refresh_rate?: string | null
  institution_detail?: BelvoInstitution
}

export interface BelvoLinksResponse {
  count: number
  next: string | null
  previous: string | null
  results: BelvoLink[]
}

export type BelvoAccountCategory =
  | 'CHECKING_ACCOUNT'
  | 'SAVINGS_ACCOUNT'
  | 'CREDIT_CARD'
  | 'LOAN_ACCOUNT'
  | 'INVESTMENT_ACCOUNT'
  | 'PENSION_FUND_ACCOUNT'
  | 'BUSINESS_CHECKING_ACCOUNT'
  | 'UNCATEGORIZED'

export interface BelvoCreditCardData {
  collected_at?: string
  monthly_payment?: number
  minimum_payment?: number
  no_interest_payment?: number
  interest_rate?: number
  end_date?: string
  last_payment_date?: string
  last_period_balance?: number
  credit_limit?: number
  available_credit?: number
}

export interface BelvoAccount {
  id: string
  link: string
  institution: string
  collected_at: string
  created_at: string
  last_accessed_at?: string | null
  category: BelvoAccountCategory
  balance_type?: string
  type: string
  name: string
  number: string
  agency?: string
  balance: {
    current: number
    available?: number
    credit?: number
  }
  currency: string
  public_identification_name?: string
  public_identification_value?: string
  credit_data?: BelvoCreditCardData | null
}

export interface BelvoAccountsResponse {
  count: number
  next: string | null
  previous: string | null
  results: BelvoAccount[]
}

export type BelvoTransactionType = 'INFLOW' | 'OUTFLOW'
export type BelvoTransactionStatus = 'PENDING' | 'PROCESSED' | 'UNCATEGORIZED'

export interface BelvoTransaction {
  id: string
  account: {
    id: string
    link: string
    institution: string
    name: string
    category: BelvoAccountCategory
    currency: string
    balance: {
      current: number
      available?: number
    }
  }
  collected_at: string
  created_at: string
  value_date: string
  accounting_date?: string | null
  amount: number
  balance?: number | null
  currency: string
  description: string
  observations?: string | null
  merchant?: {
    logo?: string
    website?: string
    merchant_name: string
  } | null
  category?: string | null
  subcategory?: string | null
  reference?: string | null
  type: BelvoTransactionType
  status: BelvoTransactionStatus
}

export interface BelvoTransactionsResponse {
  count: number
  next: string | null
  previous: string | null
  results: BelvoTransaction[]
}

export interface BelvoTokenResponse {
  access: string
  refresh?: string
}
