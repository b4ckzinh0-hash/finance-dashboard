import { NextResponse } from 'next/server'
import { createConnectToken } from '@/lib/open-finance/belvo-client'
import { isBelvoConfigured } from '@/lib/open-finance/belvo-config'

/**
 * POST /api/belvo/connect-token
 * Creates a Belvo Connect Widget session token.
 * Returns: { accessToken: string }
 */
export async function POST() {
  if (!isBelvoConfigured()) {
    return NextResponse.json(
      { error: 'Configure as variáveis BELVO_SECRET_ID e BELVO_SECRET_PASSWORD' },
      { status: 503 }
    )
  }

  try {
    const accessToken = await createConnectToken()
    return NextResponse.json({ accessToken })
  } catch (err) {
    console.error('[belvo/connect-token]', err)
    const status = classifyBelvoError(err)
    return NextResponse.json(
      { error: 'Falha ao gerar token de conexão (Belvo)' },
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
