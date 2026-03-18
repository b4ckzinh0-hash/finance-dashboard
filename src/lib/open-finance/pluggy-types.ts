/**
 * TypeScript interfaces for the Pluggy REST API.
 * Safe to import from both client and server code (no side-effects).
 */

export interface PluggyAuthResponse {
  apiKey: string
}

export interface PluggyConnectTokenResponse {
  accessToken: string
}

export interface PluggyConnector {
  id: number
  name: string
  institutionUrl?: string
  country: string
  type: string
  credentials: Array<{ label: string; name: string; type: string }>
  imageUrl?: string
  primaryColor?: string
}

export type PluggyItemStatus =
  | 'UPDATED'
  | 'UPDATING'
  | 'WAITING_USER_INPUT'
  | 'LOGIN_ERROR'
  | 'OUTDATED'
  | 'ERROR'

export interface PluggyItem {
  id: string
  connector: PluggyConnector
  status: PluggyItemStatus
  statusDetail?: string
  executionStatus?: string
  createdAt: string
  updatedAt: string
  lastUpdatedAt?: string
  error?: { code: string; message: string }
}

export interface PluggyItemsResponse {
  total: number
  totalPages: number
  page: number
  results: PluggyItem[]
}

export type PluggyAccountType = 'BANK' | 'CREDIT'

export type PluggyAccountSubtype =
  | 'CHECKING_ACCOUNT'
  | 'SAVINGS_ACCOUNT'
  | 'CREDIT_CARD'
  | 'INVESTMENT'

export interface PluggyAccount {
  id: string
  itemId: string
  type: PluggyAccountType
  subtype: PluggyAccountSubtype
  name: string
  balance: number
  currencyCode: string
  number?: string
  owner?: string
  creditData?: {
    level?: string
    brand?: string
    availableCreditLimit?: number
    creditLimit?: number
    minimumPayment?: number
    balanceCloseDate?: string
  }
  bankData?: {
    transferNumber?: string
    closingBalance?: number
  }
}

export interface PluggyAccountsResponse {
  total: number
  totalPages: number
  page: number
  results: PluggyAccount[]
}

export type PluggyTransactionType = 'CREDIT' | 'DEBIT'

export interface PluggyTransaction {
  id: string
  accountId: string
  date: string
  description: string
  amount: number
  type: PluggyTransactionType
  balance?: number
  currencyCode: string
  amountInAccountCurrency?: number
  category?: string
  categoryId?: string
  merchant?: {
    name: string
    businessName?: string
    cnpj?: string
    cnae?: number
    category?: string
  }
  paymentData?: {
    payer?: {
      name?: string
      documentType?: string
      documentNumber?: string
      branchNumber?: string
      accountNumber?: string
      routingNumber?: string
    }
    receiver?: {
      name?: string
      documentType?: string
      documentNumber?: string
      branchNumber?: string
      accountNumber?: string
      routingNumber?: string
    }
    paymentMethod?: string
    referenceNumber?: string
    reason?: string
  }
}

export interface PluggyTransactionsResponse {
  total: number
  totalPages: number
  page: number
  results: PluggyTransaction[]
}
