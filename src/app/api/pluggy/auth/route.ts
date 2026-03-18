import { NextResponse } from 'next/server'
import { authenticate } from '@/lib/open-finance/pluggy-client'
import { isPluggyConfigured } from '@/lib/open-finance/config'

/**
 * POST /api/pluggy/auth
 * Authenticates with Pluggy using server-side credentials.
 * Returns a short-lived API key.
 *
 * Note: The API key is NOT safe to expose publicly. Use connect-token for the widget.
 */
export async function POST() {
  if (!isPluggyConfigured()) {
    return NextResponse.json(
      { error: 'Configure as variáveis PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET' },
      { status: 503 }
    )
  }

  try {
    const apiKey = await authenticate()
    return NextResponse.json({ apiKey })
  } catch (err) {
    console.error('[pluggy/auth]', err)
    return NextResponse.json(
      { error: 'Falha na autenticação com Pluggy' },
      { status: 500 }
    )
  }
}
