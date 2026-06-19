/**
 * Direct pay-per-generation (server-only). No prepaid balance: each generation
 * is funded by a wallet payment to the treasury. A single payment funds exactly
 * its USD value of generation work (so one user action that fans out into a few
 * internal calls is covered by one payment), and is only *spent* on success —
 * a failed generation leaves the payment valid for a free retry.
 *
 * Payment state is in-memory (payments are used immediately after sending), keyed
 * by txSignature. Verification reads the transfer to the treasury via RPC.
 */
import { Connection } from '@solana/web3.js'
import { TOKEN } from '@/app/lib/credits'
import { getTokenUsdPrice } from '@/app/lib/server/tokenPrice'

const WINDOW_MS = 15 * 60 * 1000
const RPC =
  process.env.SOLANA_RPC_URL ||
  (TOKEN.NETWORK === 'solana-mainnet'
    ? 'https://api.mainnet-beta.solana.com'
    : 'https://api.devnet.solana.com')

interface Payment {
  wallet: string
  verifiedCents: number
  spentCents: number
  at: number
}
const payments = new Map<string, Payment>()

type Meta = {
  preTokenBalances?: readonly unknown[] | null
  postTokenBalances?: readonly unknown[] | null
} | null

/** post-minus-pre UI amount of `mint` held by `owner` (negative if they sent). */
function tokenDelta(meta: Meta, mint: string, owner: string): number {
  if (!meta) return 0
  type Bal = { mint: string; owner?: string; uiTokenAmount: { uiAmount: number | null } }
  const amt = (arr: readonly unknown[] | null | undefined) =>
    (arr as Bal[] | undefined)?.find((x) => x.mint === mint && x.owner === owner)?.uiTokenAmount
      .uiAmount ?? 0
  return amt(meta.postTokenBalances) - amt(meta.preTokenBalances)
}

export interface PayResult {
  ok: boolean
  status?: number
  code?: string
  error?: string
}

/**
 * Verify (first sight) + check a payment can cover `costCents` more work.
 * Does NOT spend — call spendPayment() after the generation succeeds.
 */
export async function checkPayment(
  txSignature: string,
  wallet: string,
  costCents: number
): Promise<PayResult> {
  let p = payments.get(txSignature)

  if (!p) {
    try {
      const conn = new Connection(RPC, 'confirmed')
      const tx = await conn.getParsedTransaction(txSignature, { maxSupportedTransactionVersion: 0 })
      if (!tx || tx.meta?.err) {
        return { ok: false, status: 400, code: 'TX_NOT_FOUND', error: 'Payment transaction not found.' }
      }
      const received = tokenDelta(tx.meta, TOKEN.MINT, TOKEN.TREASURY)
      if (received <= 0) {
        return { ok: false, status: 400, code: 'NO_TRANSFER', error: 'No $INDIEGEN payment to the treasury in this transaction.' }
      }
      const sent = -tokenDelta(tx.meta, TOKEN.MINT, wallet)
      if (sent <= 0) {
        return { ok: false, status: 403, code: 'NOT_PAYER', error: 'This payment was not sent by your wallet.' }
      }
      const price = await getTokenUsdPrice()
      if (!price) {
        return { ok: false, status: 503, code: 'PRICE', error: 'Token price unavailable, try again.' }
      }
      p = { wallet, verifiedCents: Math.floor(received * price * 100), spentCents: 0, at: Date.now() }
      payments.set(txSignature, p)
    } catch {
      return { ok: false, status: 502, code: 'VERIFY', error: 'Could not verify payment.' }
    }
  }

  if (p.wallet !== wallet) {
    return { ok: false, status: 403, code: 'PAYMENT_WALLET_MISMATCH', error: 'Payment belongs to another wallet.' }
  }
  if (Date.now() - p.at > WINDOW_MS) {
    return { ok: false, status: 402, code: 'PAYMENT_EXPIRED', error: 'Payment expired — pay again.' }
  }
  if (p.spentCents + costCents > p.verifiedCents) {
    return { ok: false, status: 402, code: 'PAYMENT_EXHAUSTED', error: 'Payment does not cover this generation.' }
  }
  return { ok: true }
}

/** Spend `costCents` against a payment. Call only after a successful generation. */
export function spendPayment(txSignature: string, costCents: number): void {
  const p = payments.get(txSignature)
  if (p) p.spentCents += costCents
}

// drop stale payments occasionally
if (typeof setInterval === 'function') {
  setInterval(() => {
    const now = Date.now()
    payments.forEach((p, k) => {
      if (now - p.at > WINDOW_MS) payments.delete(k)
    })
  }, WINDOW_MS).unref?.()
}
