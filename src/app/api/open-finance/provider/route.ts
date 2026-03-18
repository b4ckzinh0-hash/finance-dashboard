import { NextResponse } from 'next/server'
import { isPluggyConfigured } from '@/lib/open-finance/config'
import { isBelvoConfigured } from '@/lib/open-finance/belvo-config'

/**
 * GET /api/open-finance/provider
 * Returns which Open Finance providers are currently configured.
 * Used by the frontend to determine which provider(s) to use.
 */
export async function GET() {
  const pluggy = isPluggyConfigured()
  const belvo = isBelvoConfigured()

  return NextResponse.json({ pluggy, belvo })
}
