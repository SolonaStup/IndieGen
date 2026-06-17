import { NextRequest, NextResponse } from 'next/server'
import { gateRequest, settle } from '@/app/lib/server/charge'
import { estimate3DUsd, usdToCents, usdToTokens } from '@/app/lib/credits'
import { getTokenUsdPrice } from '@/app/lib/server/tokenPrice'
import { generate3D, isMeshyConfigured } from '@/app/lib/server/meshy'

// 3D generation can take a while (Meshy preview ~30–60s).
export const maxDuration = 300

/**
 * POST /api/generate-3d
 * Body: { prompt, walletAddress, artStyle?, topology?, targetPolycount? }
 * Credit-metered (model3d); deducted only on success.
 */
export async function POST(request: NextRequest) {
  try {
    const { prompt, walletAddress, artStyle, topology, targetPolycount } =
      await request.json().catch(() => ({}))

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'Describe the model you want.' }, { status: 400 })
    }

    // Price scales with prompt complexity ($2–$15); charged exactly.
    const priceUsd = estimate3DUsd(prompt)
    const gate = await gateRequest(request, 'model3d', usdToCents(priceUsd))
    if ('error' in gate) return gate.error

    const result = await generate3D({
      prompt: prompt.trim(),
      artStyle,
      topology,
      targetPolycount,
    })

    if (!result.modelUrl) {
      return NextResponse.json({ error: 'No model returned.' }, { status: 502 })
    }

    // Success — deduct the exact USD-priced amount.
    await settle(gate.address, 'model3d', gate.cost)

    const tokenUsd = await getTokenUsdPrice()
    const priceTokens = tokenUsd ? usdToTokens(priceUsd, tokenUsd) : null
    return NextResponse.json({ ...result, priceUsd, priceTokens, tokenUsd })
  } catch (error) {
    console.error('Error in generate-3d route:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    )
  }
}

/** GET /api/generate-3d — provider status (live vs mock). */
export async function GET() {
  return NextResponse.json({ provider: 'meshy', live: isMeshyConfigured() })
}
