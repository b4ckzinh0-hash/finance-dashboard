import { NextRequest, NextResponse } from 'next/server'
import { deleteLink } from '@/lib/open-finance/belvo-client'
import { isBelvoConfigured } from '@/lib/open-finance/belvo-config'

interface RouteParams {
  params: Promise<{ itemId: string }>
}

/**
 * DELETE /api/belvo/items/[itemId]
 * Disconnects (deletes) a Belvo link.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  if (!isBelvoConfigured()) {
    return NextResponse.json(
      { error: 'Configure as variáveis BELVO_SECRET_ID e BELVO_SECRET_PASSWORD' },
      { status: 503 }
    )
  }

  const { itemId } = await params

  try {
    await deleteLink(itemId)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[belvo/items/[itemId] DELETE]', err)
    return NextResponse.json(
      { error: 'Falha ao desconectar banco (Belvo)' },
      { status: 500 }
    )
  }
}
