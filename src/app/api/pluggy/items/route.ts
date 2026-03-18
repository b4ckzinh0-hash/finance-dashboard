import { NextResponse } from 'next/server'
import { authenticate, getItems } from '@/lib/open-finance/pluggy-client'
import { isPluggyConfigured } from '@/lib/open-finance/config'

/**
 * GET /api/pluggy/items
 * Lists all connected bank items (connections) for this application.
 * Returns 503 if Pluggy is not configured.
 */
export async function GET() {
  if (!isPluggyConfigured()) {
    return NextResponse.json(
      { error: 'Configure as variáveis PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET' },
      { status: 503 }
    )
  }

  try {
    const apiKey = await authenticate()
    const items = await getItems(apiKey)
    return NextResponse.json(items)
  } catch (err) {
    console.error('[pluggy/items GET]', err)
    const status = classifyPluggyError(err)
    return NextResponse.json(
      { error: 'Falha ao listar bancos conectados' },
      { status }
    )
  }
}

/** Maps a Pluggy client error to an appropriate HTTP status code. */
function classifyPluggyError(err: unknown): number {
  if (err instanceof Error) {
    if (err.message.includes('timeout')) return 504
    const httpStatus = (err as Error & { status?: number }).status
    if (httpStatus === 401 || httpStatus === 403) return 401
  }
  return 500
}
