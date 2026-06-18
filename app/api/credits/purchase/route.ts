import { NextRequest, NextResponse } from 'next/server'
import { Connection } from '@solana/web3.js'
import { getAuthedAddress } from '@/app/lib/server/auth'
import { getAccount, grant } from '@/app/lib/server/creditStore'
import { getTokenUsdPrice } from '@/app/lib/server/tokenPrice'
import { FAUCET_AMOUNT, TOKEN } from '@/app/lib/credits'

/**
 * POST /api/credits/purchase  (wallet must be signed in)
 *
 *  - { faucet: true }                 → dev faucet (non-prod only), grants FAUCET_AMOUNT
 *  - { txSignature, ... }             → on-chain purchase: verify a $INDIEGEN
 *                                       transfer to the treasury, then grant credits
 *
 * The wallet is taken from the SESSION, never the body — you can only credit a
 * wallet you proved you own.
 */

const FAUCET_ENABLED =
  process.env.NODE_ENV !== 'production' || process.env.ENABLE_FAUCET === 'true'

const RPC =
  process.env.SOLANA_RPC_URL ||
  (TOKEN.NETWORK === 'solana-mainnet'
    ? 'https://api.mainnet-beta.solana.com'
    : 'https://api.devnet.solana.com')

/** Net increase (UI amount) of `mint` held by `owner` across the tx. Works for
 *  both legacy SPL and Token-2022 since meta token balances are program-agnostic. */
function treasuryDelta(
  meta: {
    preTokenBalances?: readonly unknown[] | null
    postTokenBalances?: readonly unknown[] | null
  } | null,
  mint: string,
  owner: string
): number {
  if (!meta) return 0
  type Bal = { mint: string; owner?: string; uiTokenAmount: { uiAmount: number | null } }
  const amt = (arr: readonly unknown[] | null | undefined) => {
    const b = (arr as Bal[] | undefined)?.find((x) => x.mint === mint && x.owner === owner)
    return b?.uiTokenAmount.uiAmount ?? 0
  }
  return amt(meta.postTokenBalances) - amt(meta.preTokenBalances)
}

export async function POST(request: NextRequest) {
  const address = getAuthedAddress(request)
  if (!address) {
    return NextResponse.json(
      { error: 'Sign in with your wallet first.', code: 'NO_AUTH' },
      { status: 401 }
    )
  }

  const { faucet, txSignature } = await request.json().catch(() => ({}))

  // --- Dev faucet (never in production unless explicitly enabled) ----------
  if (faucet) {
    if (!FAUCET_ENABLED) {
      return NextResponse.json({ error: 'Faucet is disabled.' }, { status: 403 })
    }
    const balance = await grant(address, FAUCET_AMOUNT, 'faucet', 'dev faucet')
    return NextResponse.json({ ok: true, balanceUsd: balance / 100, addedUsd: FAUCET_AMOUNT / 100 })
  }

  // --- Real on-chain purchase ---------------------------------------------
  if (typeof txSignature === 'string' && txSignature) {
    if (!TOKEN.MINT || !TOKEN.TREASURY) {
      return NextResponse.json(
        { error: 'On-chain purchase not enabled yet — $INDIEGEN not launched.' },
        { status: 501 }
      )
    }

    // Idempotency: never credit the same signature twice.
    const acc = await getAccount(address)
    if (acc.history.some((h) => h.note === txSignature)) {
      return NextResponse.json({ error: 'Transaction already credited.' }, { status: 409 })
    }

    try {
      const conn = new Connection(RPC, 'confirmed')
      const tx = await conn.getParsedTransaction(txSignature, {
        maxSupportedTransactionVersion: 0,
      })
      if (!tx || tx.meta?.err) {
        return NextResponse.json(
          { error: 'Transaction not found or failed.' },
          { status: 400 }
        )
      }

      const received = treasuryDelta(tx.meta, TOKEN.MINT, TOKEN.TREASURY)
      if (received <= 0) {
        return NextResponse.json(
          { error: 'No $INDIEGEN transfer to the treasury found in this transaction.' },
          { status: 400 }
        )
      }

      // Value the tokens received at the live market price → US cents.
      const tokenUsd = await getTokenUsdPrice()
      if (!tokenUsd) {
        return NextResponse.json({ error: 'Token price unavailable, try again.' }, { status: 503 })
      }
      const addedCents = Math.floor(received * tokenUsd * 100)
      if (addedCents <= 0) {
        return NextResponse.json({ error: 'Amount too small to credit.' }, { status: 400 })
      }
      const balance = await grant(address, addedCents, 'purchase', txSignature)
      return NextResponse.json({
        ok: true,
        balanceUsd: balance / 100,
        addedUsd: addedCents / 100,
        tokens: received,
        tokenUsd,
      })
    } catch (e) {
      console.error('purchase verify error:', e)
      return NextResponse.json({ error: 'Could not verify transaction.' }, { status: 502 })
    }
  }

  return NextResponse.json({ error: 'faucet:true or txSignature required' }, { status: 400 })
}
