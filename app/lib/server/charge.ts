import { NextResponse, type NextRequest } from 'next/server'
import { getAccount, spend } from '@/app/lib/server/creditStore'
import { getAuthedAddress } from '@/app/lib/server/auth'
import { rateLimit } from '@/app/lib/server/ratelimit'
import { actionCostCents, centsToUsd, CreditAction } from '@/app/lib/credits'

/**
 * Auth + affordability gate. Derives the wallet from the SIGNED SESSION COOKIE
 * (never the request body), so a caller can only ever spend the balance of a
 * wallet they proved they own. Balances and costs are in US cents.
 *
 *   const gate = await gateRequest(request, 'image')      // flat USD price
 *   const gate = await gateRequest(request, 'model3d', usdToCents(priceUsd))  // dynamic
 *   if ('error' in gate) return gate.error
 *   ... do the generation ...
 *   await settle(gate.address, 'image', gate.cost)        // only after success
 *
 * `gate.cost` is the cents to charge — pass it back to settle so dynamic and
 * flat pricing stay consistent.
 */
export async function gateRequest(
  request: NextRequest,
  action: CreditAction,
  overrideCents?: number
): Promise<{ error: NextResponse } | { ok: true; address: string; cost: number }> {
  const address = getAuthedAddress(request)
  if (!address) {
    return {
      error: NextResponse.json(
        { error: 'Sign in with your wallet to generate.', code: 'NO_AUTH' },
        { status: 401 }
      ),
    }
  }

  const rl = rateLimit(`gen:${address}`)
  if (!rl.ok) {
    return {
      error: NextResponse.json(
        { error: 'Slow down — too many requests.', code: 'RATE_LIMITED', retryAfter: rl.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      ),
    }
  }

  const cost = overrideCents ?? actionCostCents(action)
  const acc = await getAccount(address)
  if (acc.credits < cost) {
    return {
      error: NextResponse.json(
        {
          error: 'Not enough balance — top up to continue.',
          code: 'INSUFFICIENT_CREDITS',
          balanceUsd: centsToUsd(acc.credits),
          costUsd: centsToUsd(cost),
        },
        { status: 402 }
      ),
    }
  }
  return { ok: true, address, cost }
}

/** Deduct `cents` (defaults to the action's flat price). Call only on success. */
export async function settle(
  walletAddress: string,
  action: CreditAction,
  overrideCents?: number
): Promise<void> {
  await spend(walletAddress, overrideCents ?? actionCostCents(action), action)
}
