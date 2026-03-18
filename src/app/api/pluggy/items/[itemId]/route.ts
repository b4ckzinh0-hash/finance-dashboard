import { NextRequest, NextResponse } from 'next/server'
import { authenticate, getItem, deleteItem } from '@/lib/open-finance/pluggy-client'
import { isPluggyConfigured } from '@/lib/open-finance/config'

/**
 * GET /api/pluggy/items/[itemId]
 * Returns details for a specific connected bank item.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  if (!isPluggyConfigured()) {
    return NextResponse.json(
      { error: 'Configure as variáveis PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET' },
      { status: 503 }
    )
  }

  try {
    const { itemId } = await params
    const apiKey = await authenticate()
    const item = await getItem(apiKey, itemId)
    return NextResponse.json(item)
  } catch (err) {
    console.error('[pluggy/items/[itemId] GET]', err)
    return NextResponse.json(
      { error: 'Falha ao buscar dados do banco' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/pluggy/items/[itemId]
 * Disconnects (deletes) a bank item, revoking all access.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  if (!isPluggyConfigured()) {
    return NextResponse.json(
      { error: 'Configure as variáveis PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET' },
      { status: 503 }
    )
  }

  try {
    const { itemId } = await params
    const apiKey = await authenticate()
    await deleteItem(apiKey, itemId)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[pluggy/items/[itemId] DELETE]', err)
    return NextResponse.json(
      { error: 'Falha ao desconectar banco' },
      { status: 500 }
    )
  }
}
