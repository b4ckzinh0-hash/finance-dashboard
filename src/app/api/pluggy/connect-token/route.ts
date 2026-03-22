import { NextRequest, NextResponse } from 'next/server'
import { authenticate, createConnectToken } from '@/lib/open-finance/pluggy-client'
import { isPluggyConfigured } from '@/lib/open-finance/config'

/**
 * POST /api/pluggy/connect-token
 * Generates a Pluggy Connect widget token.
 * Body (optional): { itemId: string } — pass to open widget in "update" mode.
 * Returns: { accessToken: string }
 *
 * The connect token is safe to send to the frontend (it only grants widget access).
 */
export async function POST(request: NextRequest) {
  if (!isPluggyConfigured()) {
    return NextResponse.json(
      { error: 'Configure as variáveis PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET' },
      { status: 503 }
    )
  }

  try {
    let itemId: string | undefined
    try {
      const body = await request.json()
      itemId = body?.itemId
    } catch {
      // body is optional
    }

    const apiKey = await authenticate()
    const accessToken = await createConnectToken(apiKey, itemId)

    return NextResponse.json({ accessToken })
  } catch (err) {
    console.error('[pluggy/connect-token]', err)
    const status = classifyPluggyError(err)
    return NextResponse.json(
      { error: 'Falha ao gerar token de conexão' },
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
