import { NextResponse } from 'next/server'

/**
 * GET /api/config — public client config. Tells the studio whether a
 * server-side OpenRouter key exists, so it can skip the BYOK modal and run
 * fully on credits.
 */
export async function GET() {
  return NextResponse.json({
    serverKey: Boolean(process.env.OPENROUTER_API_KEY?.trim()),
  })
}
