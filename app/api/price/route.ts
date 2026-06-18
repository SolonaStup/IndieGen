import { NextResponse } from 'next/server'
import { TOKEN, isTokenLive } from '@/app/lib/credits'
import { getTokenUsdPrice } from '@/app/lib/server/tokenPrice'

/** GET /api/price → live $INDIEGEN price for client-side USD↔token display. */
export async function GET() {
  const tokenUsd = await getTokenUsdPrice()
  return NextResponse.json({
    symbol: 'INDIEGEN',
    mint: TOKEN.MINT || null,
    live: isTokenLive(),
    tokenUsd, // $ per whole token (live from DexScreener, or fallback)
  })
}
