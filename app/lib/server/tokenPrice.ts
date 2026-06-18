/**
 * Live $INDIEGEN price oracle (server-only). Reads the most-liquid pair from
 * DexScreener by mint and caches it briefly. Falls back to the static
 * TOKEN.USD_PRICE before the token has on-chain liquidity.
 */
import { TOKEN } from '@/app/lib/credits'

let cache: { price: number; at: number } | null = null
const TTL_MS = 45_000

interface DexPair {
  priceUsd?: string
  liquidity?: { usd?: number }
}

/** Returns live $/token, or a fallback, or null if unknown. */
export async function getTokenUsdPrice(): Promise<number | null> {
  if (!TOKEN.MINT) return TOKEN.USD_PRICE || null
  const now = Date.now()
  if (cache && now - cache.at < TTL_MS) return cache.price

  try {
    const res = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${TOKEN.MINT}`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return cache?.price ?? TOKEN.USD_PRICE ?? null
    const data = (await res.json()) as { pairs?: DexPair[] }
    const pairs = (data.pairs ?? []).filter((p) => p.priceUsd)
    if (!pairs.length) return cache?.price ?? TOKEN.USD_PRICE ?? null
    pairs.sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))
    const price = Number(pairs[0].priceUsd)
    if (!price || !Number.isFinite(price)) return cache?.price ?? TOKEN.USD_PRICE ?? null
    cache = { price, at: now }
    return price
  } catch {
    return cache?.price ?? TOKEN.USD_PRICE ?? null
  }
}
