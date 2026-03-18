import { getDB } from './db'
import { createClient } from '@/lib/supabase/client'

function stripLocalFields(payload: Record<string, unknown>): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _synced, account, category, ...rest } = payload
  return rest
}

export async function syncWithServer(): Promise<{ synced: number; errors: number }> {
  const db = await getDB()
  const supabase = createClient()
  const queue = await db.getAll('sync_queue')

  let synced = 0
  let errors = 0

  for (const item of queue) {
    try {
      if (item.action === 'insert') {
        const payload = stripLocalFields(item.payload)
        const { error } = await supabase.from(item.table).insert(payload)
        if (error) throw error
      } else if (item.action === 'update') {
        const payload = stripLocalFields(item.payload)
        const { error } = await supabase.from(item.table).update(payload).eq('id', item.record_id)
        if (error) throw error
      } else if (item.action === 'delete') {
        const { error } = await supabase.from(item.table).delete().eq('id', item.record_id)
        if (error) throw error
      }

      await db.delete('sync_queue', item.id!)

      if (item.action !== 'delete') {
        const store = item.table as 'transactions' | 'accounts' | 'categories'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const record = await (db as any).get(store, item.record_id)
        if (record) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (db as any).put(store, { ...record, _synced: true })
        }
      }

      synced++
    } catch (err) {
      console.error('[Offline Sync] Failed to sync item:', item, err)
      errors++
    }
  }

  return { synced, errors }
}

async function cacheStoreData(
  store: 'transactions' | 'accounts' | 'categories',
  data: Record<string, unknown>[]
): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(store, 'readwrite')
  await tx.store.clear()
  for (const item of data) {
    tx.store.put({ ...item, _synced: true })
  }
  await tx.done
}

export function cacheTransactions(data: Record<string, unknown>[]): Promise<void> {
  return cacheStoreData('transactions', data)
}

export function cacheAccounts(data: Record<string, unknown>[]): Promise<void> {
  return cacheStoreData('accounts', data)
}

export function cacheCategories(data: Record<string, unknown>[]): Promise<void> {
  return cacheStoreData('categories', data)
}

export async function cacheServerData(): Promise<void> {
  const db = await getDB()
  const supabase = createClient()

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*, account:accounts(*), category:categories(*)')
    .order('date', { ascending: false })

  if (transactions) {
    const tx = db.transaction('transactions', 'readwrite')
    await tx.store.clear()
    for (const t of transactions) {
      await tx.store.put({ ...t, _synced: true })
    }
    await tx.done
  }

  const { data: accounts } = await supabase
    .from('accounts')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (accounts) {
    const tx = db.transaction('accounts', 'readwrite')
    await tx.store.clear()
    for (const a of accounts) {
      await tx.store.put({ ...a, _synced: true })
    }
    await tx.done
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (categories) {
    const tx = db.transaction('categories', 'readwrite')
    await tx.store.clear()
    for (const c of categories) {
      await tx.store.put({ ...c, _synced: true })
    }
    await tx.done
  }
}

export function setupOnlineListener(onSync: () => void): () => void {
  const handler = async () => {
    if (navigator.onLine) {
      const { synced } = await syncWithServer()
      if (synced > 0) {
        await cacheServerData()
        onSync()
      }
    }
  }

  window.addEventListener('online', handler)
  return () => window.removeEventListener('online', handler)
}
