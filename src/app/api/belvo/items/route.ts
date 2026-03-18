import { NextResponse } from 'next/server'
import { getLinks } from '@/lib/open-finance/belvo-client'
import { isBelvoConfigured } from '@/lib/open-finance/belvo-config'

/**
 * GET /api/belvo/items
 * Lists all connected Belvo links (bank connections).
 * Returns 503 if Belvo is not configured.
 */
export async function GET() {
  if (!isBelvoConfigured()) {
    return NextResponse.json(
      { error: 'Configure as variáveis BELVO_SECRET_ID e BELVO_SECRET_PASSWORD' },
      { status: 503 }
    )
  }

  try {
    const links = await getLinks()
    return NextResponse.json(links)
  } catch (err) {
    console.error('[belvo/items GET]', err)
    const status = classifyBelvoError(err)
    return NextResponse.json(
      { error: 'Falha ao listar bancos conectados (Belvo)' },
      { status }
    )
  }
}

/** Maps a Belvo client error to an appropriate HTTP status code. */
function classifyBelvoError(err: unknown): number {
  if (err instanceof Error) {
    if (err.message.includes('timeout')) return 504
    const httpStatus = (err as Error & { status?: number }).status
    if (httpStatus === 401 || httpStatus === 403) return 401
  }
  return 500
}
