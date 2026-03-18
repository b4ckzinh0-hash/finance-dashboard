/**
 * Server-side Belvo API client.
 *
 * All methods use fetch() to call the Belvo REST API.
 * Authentication: Basic Auth with Secret ID + Secret Password.
 * Reference: https://developers.belvo.com/reference
 *
 * NEVER import this file from client components — it reads server-side env vars.
 * Use the /api/belvo/* routes to expose data to the frontend.
 */

import { getBelvoBaseUrl, getBelvoCredentials } from './belvo-config'
import type {
  BelvoLink,
  BelvoLinksResponse,
  BelvoAccount,
  BelvoAccountsResponse,
  BelvoTransaction,
  BelvoTransactionsResponse,
  BelvoTokenResponse,
} from './belvo-types'

/** Timeout in milliseconds for all Belvo API requests. */
const BELVO_FETCH_TIMEOUT_MS = 15_000

/**
 * Returns a Basic Auth header value for the Belvo credentials.
 */
function getBelvoAuthHeader(): string {
  const { secretId, secretPassword } = getBelvoCredentials()
  const encoded = Buffer.from(`${secretId}:${secretPassword}`).toString('base64')
  return `Basic ${encoded}`
}

/**
 * Wrapper around fetch() that adds a 15-second AbortController timeout
 * and Belvo Basic Auth headers automatically.
 */
async function belvoFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), BELVO_FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, {
      ...options,
      headers: {
        Authorization: getBelvoAuthHeader(),
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> | undefined),
      },
      signal: controller.signal,
      cache: 'no-store',
    })
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Belvo API timeout after ${BELVO_FETCH_TIMEOUT_MS / 1000}s: ${url}`)
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Creates a Belvo Connect Widget session token.
 * Returns a short-lived access token (JWT) used to initialize the widget.
 * Reference: POST /api/token/
 */
export async function createConnectToken(): Promise<string> {
  const baseUrl = getBelvoBaseUrl()
  const res = await belvoFetch(`${baseUrl}/api/token/`, {
    method: 'POST',
    body: JSON.stringify({ scopes: 'read_institutions,write_links,read_links' }),
  })

  if (!res.ok) {
    const body = await res.text()
    const err = new Error(`Belvo createConnectToken failed (${res.status}): ${body}`) as Error & {
      status: number
    }
    err.status = res.status
    throw err
  }

  const data = (await res.json()) as BelvoTokenResponse
  return data.access
}

/**
 * Lists all connected links (bank connections).
 * Reference: GET /api/links/
 */
export async function getLinks(): Promise<BelvoLink[]> {
  const baseUrl = getBelvoBaseUrl()
  const res = await belvoFetch(`${baseUrl}/api/links/`)

  if (!res.ok) {
    const body = await res.text()
    const err = new Error(`Belvo getLinks failed (${res.status}): ${body}`) as Error & {
      status: number
    }
    err.status = res.status
    throw err
  }

  const data = (await res.json()) as BelvoLinksResponse
  return data.results
}

/**
 * Deletes (disconnects) a bank link.
 * Reference: DELETE /api/links/{id}/
 */
export async function deleteLink(linkId: string): Promise<void> {
  const baseUrl = getBelvoBaseUrl()
  const res = await belvoFetch(`${baseUrl}/api/links/${linkId}/`, {
    method: 'DELETE',
  })

  if (!res.ok && res.status !== 204) {
    const body = await res.text()
    throw new Error(`Belvo deleteLink failed (${res.status}): ${body}`)
  }
}

/**
 * Fetches bank accounts for a connected link.
 * Reference: GET /api/accounts/?link={linkId}
 */
export async function getAccounts(linkId: string): Promise<BelvoAccount[]> {
  const baseUrl = getBelvoBaseUrl()
  const url = new URL(`${baseUrl}/api/accounts/`)
  url.searchParams.set('link', linkId)

  const res = await belvoFetch(url.toString())

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Belvo getAccounts failed (${res.status}): ${body}`)
  }

  const data = (await res.json()) as BelvoAccountsResponse
  return data.results
}

/**
 * Fetches bank transactions for a connected link.
 * Reference: GET /api/transactions/?link={linkId}
 *
 * @param linkId - Belvo link ID
 * @param from   - ISO date string (optional), e.g. "2024-01-01"
 * @param to     - ISO date string (optional), e.g. "2024-12-31"
 */
export async function getTransactions(
  linkId: string,
  from?: string,
  to?: string
): Promise<BelvoTransaction[]> {
  const baseUrl = getBelvoBaseUrl()
  const url = new URL(`${baseUrl}/api/transactions/`)
  url.searchParams.set('link', linkId)
  if (from) url.searchParams.set('date_from', from)
  if (to) url.searchParams.set('date_to', to)
  url.searchParams.set('page_size', '100')

  const res = await belvoFetch(url.toString())

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Belvo getTransactions failed (${res.status}): ${body}`)
  }

  const data = (await res.json()) as BelvoTransactionsResponse
  return data.results
}
