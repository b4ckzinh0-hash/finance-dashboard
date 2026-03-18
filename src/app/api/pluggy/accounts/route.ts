import { NextRequest, NextResponse } from 'next/server'
import { authenticate, getAccounts } from '@/lib/open-finance/pluggy-client'
import { isPluggyConfigured } from '@/lib/open-finance/config'

/**
 * GET /api/pluggy/accounts?itemId=xxx
 * Returns real bank accounts with balances for the given connected item.
 */
export async function GET(request: NextRequest) {
  if (!isPluggyConfigured()) {
    return NextResponse.json(
      { error: 'Configure as variáveis PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET' },
      { status: 503 }
    )
  }

  const itemId = request.nextUrl.searchParams.get('itemId')
  if (!itemId) {
    return NextResponse.json({ error: 'itemId é obrigatório' }, { status: 400 })
  }

  try {
    const apiKey = await authenticate()
    const accounts = await getAccounts(apiKey, itemId)
    return NextResponse.json(accounts)
  } catch (err) {
    console.error('[pluggy/accounts]', err)
    return NextResponse.json(
      { error: 'Falha ao buscar contas bancárias' },
      { status: 500 }
    )
  }
}
