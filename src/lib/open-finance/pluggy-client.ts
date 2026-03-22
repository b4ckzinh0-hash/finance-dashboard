/**
 * Server-side Pluggy API client.
 *
 * All methods use fetch() to call the Pluggy REST API.
 * Base URL: https://api.pluggy.ai
 *
 * NEVER import this file from client components — it reads server-side env vars.
 * Use the /api/pluggy/* routes to expose data to the frontend.
 */

import { PLUGGY_BASE_URL, getPluggyCredentials } from './config'
import type {
  PluggyAuthResponse,
  PluggyConnectTokenResponse,
  PluggyItem,
  PluggyItemsResponse,
  PluggyAccount,
  PluggyAccountsResponse,
  PluggyTransaction,
  PluggyTransactionsResponse,
} from './pluggy-types'

/** Timeout in milliseconds for all Pluggy API requests. */
const PLUGGY_FETCH_TIMEOUT_MS = 15_000

/**
 * Wrapper around fetch() that adds a 15-second AbortController timeout.
 * Throws a descriptive error when the request times out.
 */
async function pluggyFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), PLUGGY_FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, { ...options, signal: controller.signal, cache: 'no-store' })
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Pluggy API timeout after ${PLUGGY_FETCH_TIMEOUT_MS / 1000}s: ${url}`)
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Authenticates with Pluggy using client credentials.
 * Returns an API key (access token) valid for a short period.
 * Throws a structured error with `status` property for HTTP failures.
 */
export async function authenticate(): Promise<string> {
  const { clientId, clientSecret } = getPluggyCredentials()

  const res = await pluggyFetch(`${PLUGGY_BASE_URL}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, clientSecret }),
  })

  if (!res.ok) {
    const body = await res.text()
    const err = new Error(`Pluggy auth failed (${res.status}): ${body}`) as Error & { status: number }
    err.status = res.status
    throw err
  }

  const data = (await res.json()) as PluggyAuthResponse
  return data.apiKey
}

/**
 * Creates a connect token for the Pluggy Connect widget.
 * If itemId is provided, the widget opens in "update" mode for that item.
 */
export async function createConnectToken(
  apiKey: string,
  itemId?: string
): Promise<string> {
  const payload: Record<string, unknown> = {}
  if (itemId) payload.itemId = itemId

  const res = await pluggyFetch(`${PLUGGY_BASE_URL}/connect_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Pluggy connect_token failed (${res.status}): ${body}`)
  }

  const data = (await res.json()) as PluggyConnectTokenResponse
  return data.accessToken
}

/**
 * Lists all connected bank items.
 */
export async function getItems(apiKey: string): Promise<PluggyItem[]> {
  const res = await pluggyFetch(`${PLUGGY_BASE_URL}/items`, {
    headers: { 'X-API-KEY': apiKey },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Pluggy getItems failed (${res.status}): ${body}`)
  }

  const data = (await res.json()) as PluggyItemsResponse
  return data.results
}

/**
 * Gets a specific connected bank item by ID.
 */
export async function getItem(apiKey: string, itemId: string): Promise<PluggyItem> {
  const res = await pluggyFetch(`${PLUGGY_BASE_URL}/items/${itemId}`, {
    headers: { 'X-API-KEY': apiKey },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Pluggy getItem failed (${res.status}): ${body}`)
  }

  return (await res.json()) as PluggyItem
}

/**
 * Deletes (disconnects) a bank item.
 */
export async function deleteItem(apiKey: string, itemId: string): Promise<void> {
  const res = await pluggyFetch(`${PLUGGY_BASE_URL}/items/${itemId}`, {
    method: 'DELETE',
    headers: { 'X-API-KEY': apiKey },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Pluggy deleteItem failed (${res.status}): ${body}`)
  }
}

/**
 * Fetches real bank accounts for a connected item.
 */
export async function getAccounts(
  apiKey: string,
  itemId: string
): Promise<PluggyAccount[]> {
  const url = new URL(`${PLUGGY_BASE_URL}/accounts`)
  url.searchParams.set('itemId', itemId)

  const res = await pluggyFetch(url.toString(), {
    headers: { 'X-API-KEY': apiKey },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Pluggy getAccounts failed (${res.status}): ${body}`)
  }

  const data = (await res.json()) as PluggyAccountsResponse
  return data.results
}

/**
 * Fetches real transactions for a bank account.
 *
 * @param accountId - Pluggy account ID
 * @param from      - ISO date string (optional), e.g. "2024-01-01"
 * @param to        - ISO date string (optional), e.g. "2024-12-31"
 */
export async function getTransactions(
  apiKey: string,
  accountId: string,
  from?: string,
  to?: string
): Promise<PluggyTransaction[]> {
  const url = new URL(`${PLUGGY_BASE_URL}/transactions`)
  url.searchParams.set('accountId', accountId)
  if (from) url.searchParams.set('from', from)
  if (to) url.searchParams.set('to', to)
  url.searchParams.set('pageSize', '100')

  const res = await pluggyFetch(url.toString(), {
    headers: { 'X-API-KEY': apiKey },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Pluggy getTransactions failed (${res.status}): ${body}`)
  }

  const data = (await res.json()) as PluggyTransactionsResponse
  return data.results
}

/**
 * Fetches the identity (account holder info) for a connected item.
 */
export async function getIdentity(
  apiKey: string,
  itemId: string
): Promise<unknown> {
  const res = await pluggyFetch(`${PLUGGY_BASE_URL}/identity?itemId=${itemId}`, {
    headers: { 'X-API-KEY': apiKey },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Pluggy getIdentity failed (${res.status}): ${body}`)
  }

  return res.json()
}
