import { NextRequest, NextResponse } from 'next/server'
import { getTransactions } from '@/lib/open-finance/belvo-client'
import { isBelvoConfigured } from '@/lib/open-finance/belvo-config'

/**
 * GET /api/belvo/transactions?linkId=xxx&from=2024-01-01&to=2024-12-31
 * Returns bank transactions for the given Belvo link.
 *
 * Query params:
 *   linkId (required) — Belvo link ID
 *   from   (optional) — ISO date string, e.g. "2024-01-01"
 *   to     (optional) — ISO date string, e.g. "2024-12-31"
 */
export async function GET(request: NextRequest) {
  if (!isBelvoConfigured()) {
    return NextResponse.json(
      { error: 'Configure as variáveis BELVO_SECRET_ID e BELVO_SECRET_PASSWORD' },
      { status: 503 }
    )
  }

  const { searchParams } = request.nextUrl
  const linkId = searchParams.get('linkId')
  const from = searchParams.get('from') ?? undefined
  const to = searchParams.get('to') ?? undefined

  if (!linkId) {
    return NextResponse.json({ error: 'linkId é obrigatório' }, { status: 400 })
  }

  try {
    const transactions = await getTransactions(linkId, from, to)
    return NextResponse.json(transactions)
  } catch (err) {
    console.error('[belvo/transactions]', err)
    return NextResponse.json(
      { error: 'Falha ao buscar transações (Belvo)' },
      { status: 500 }
    )
  }
}
