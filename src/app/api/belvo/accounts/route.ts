import { NextRequest, NextResponse } from 'next/server'
import { getAccounts } from '@/lib/open-finance/belvo-client'
import { isBelvoConfigured } from '@/lib/open-finance/belvo-config'

/**
 * GET /api/belvo/accounts?linkId=xxx
 * Returns bank accounts for the given Belvo link.
 */
export async function GET(request: NextRequest) {
  if (!isBelvoConfigured()) {
    return NextResponse.json(
      { error: 'Configure as variáveis BELVO_SECRET_ID e BELVO_SECRET_PASSWORD' },
      { status: 503 }
    )
  }

  const linkId = request.nextUrl.searchParams.get('linkId')
  if (!linkId) {
    return NextResponse.json({ error: 'linkId é obrigatório' }, { status: 400 })
  }

  try {
    const accounts = await getAccounts(linkId)
    return NextResponse.json(accounts)
  } catch (err) {
    console.error('[belvo/accounts]', err)
    return NextResponse.json(
      { error: 'Falha ao buscar contas bancárias (Belvo)' },
      { status: 500 }
    )
  }
}
