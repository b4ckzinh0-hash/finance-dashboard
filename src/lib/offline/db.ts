import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

interface FinanceDB extends DBSchema {
  transactions: {
    key: string
    value: {
      id: string
      user_id: string
      account_id: string
      category_id: string
      type: string
      amount: number
      description: string
      date: string
      payment_method: string
      notes: string | null
      is_recurring: boolean
      recurring_id: string | null
      created_at: string
      updated_at: string
      account?: Record<string, unknown>
      category?: Record<string, unknown>
      _synced: boolean
    }
    indexes: { 'by-date': string; 'by-synced': number }
  }
  accounts: {
    key: string
    value: {
      id: string
      user_id: string
      name: string
      type: string
      balance: number
      color: string
      icon: string
      is_active: boolean
      created_at: string
      updated_at: string
      _synced: boolean
    }
  }
  categories: {
    key: string
    value: {
      id: string
      user_id: string
      name: string
      type: string
      icon: string
      color: string
      is_default: boolean
      parent_id: string | null
      created_at: string
      _synced: boolean
    }
  }
  sync_queue: {
    key: number
    value: {
      id?: number
      table: 'transactions' | 'accounts' | 'categories'
      action: 'insert' | 'update' | 'delete'
      record_id: string
      payload: Record<string, unknown>
      created_at: string
    }
    indexes: { 'by-table': string }
  }
}

let dbInstance: IDBPDatabase<FinanceDB> | null = null

export async function getDB(): Promise<IDBPDatabase<FinanceDB>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<FinanceDB>('finance-dashboard', 1, {
    upgrade(db) {
      const txStore = db.createObjectStore('transactions', { keyPath: 'id' })
      txStore.createIndex('by-date', 'date')
      txStore.createIndex('by-synced', '_synced')

      db.createObjectStore('accounts', { keyPath: 'id' })

      db.createObjectStore('categories', { keyPath: 'id' })

      const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true })
      syncStore.createIndex('by-table', 'table')
    },
  })

  return dbInstance
}
