import { getDB } from './db'

// ---------- TRANSACTIONS ----------

export async function getOfflineTransactions() {
  const db = await getDB()
  const all = await db.getAllFromIndex('transactions', 'by-date')
  return all.reverse()
}

export async function addOfflineTransaction(transaction: Record<string, unknown>) {
  const db = await getDB()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.put('transactions', { ...transaction, _synced: false } as any)
  await db.add('sync_queue', {
    table: 'transactions',
    action: 'insert',
    record_id: transaction.id as string,
    payload: transaction,
    created_at: new Date().toISOString(),
  })
}

export async function updateOfflineTransaction(id: string, payload: Record<string, unknown>) {
  const db = await getDB()
  const existing = await db.get('transactions', id)
  if (existing) {
    await db.put('transactions', { ...existing, ...payload, _synced: false })
    await db.add('sync_queue', {
      table: 'transactions',
      action: 'update',
      record_id: id,
      payload: { ...existing, ...payload },
      created_at: new Date().toISOString(),
    })
  }
}

export async function deleteOfflineTransaction(id: string) {
  const db = await getDB()
  await db.delete('transactions', id)
  await db.add('sync_queue', {
    table: 'transactions',
    action: 'delete',
    record_id: id,
    payload: {},
    created_at: new Date().toISOString(),
  })
}

// ---------- ACCOUNTS ----------

export async function getOfflineAccounts() {
  const db = await getDB()
  return db.getAll('accounts')
}

// ---------- CATEGORIES ----------

export async function getOfflineCategories() {
  const db = await getDB()
  return db.getAll('categories')
}

// ---------- SYNC QUEUE ----------

export async function getPendingSyncCount(): Promise<number> {
  const db = await getDB()
  return (await db.getAll('sync_queue')).length
}
