import { NextRequest, NextResponse } from 'next/server'
import { authenticate, getTransactions } from '@/lib/open-finance/pluggy-client'
import { isPluggyConfigured } from '@/lib/open-finance/config'

/**
 * GET /api/pluggy/transactions?accountId=xxx&from=2024-01-01&to=2024-12-31
 * Returns real bank transactions for the given account.
 *
 * Query params:
 *   accountId (required) — Pluggy account ID
 *   from      (optional) — ISO date string, e.g. "2024-01-01"
 *   to        (optional) — ISO date string, e.g. "2024-12-31"
 */
export async function GET(request: NextRequest) {
  if (!isPluggyConfigured()) {
    return NextResponse.json(
      { error: 'Configure as variáveis PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET' },
      { status: 503 }
    )
  }

  const { searchParams } = request.nextUrl
  const accountId = searchParams.get('accountId')
  const from = searchParams.get('from') ?? undefined
  const to = searchParams.get('to') ?? undefined

  if (!accountId) {
    return NextResponse.json({ error: 'accountId é obrigatório' }, { status: 400 })
  }

  try {
    const apiKey = await authenticate()
    const transactions = await getTransactions(apiKey, accountId, from, to)
    return NextResponse.json(transactions)
  } catch (err) {
    console.error('[pluggy/transactions]', err)
    return NextResponse.json(
      { error: 'Falha ao buscar transações' },
      { status: 500 }
    )
  }
}
