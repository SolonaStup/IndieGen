# How INDIEGEN works

A technical overview of the studio and how it interacts with the **$INDIEGEN**
token. Plain-language but accurate to the implementation.

---

## 1. What it is

INDIEGEN turns a text prompt into **game-ready assets** — 2D sprites &
animations, autotile tilesets, parallax backgrounds, prop libraries, and
low-poly 3D models — export-ready for Unity, Godot and Unreal.

The whole thing runs in the browser (Next.js app). The **$INDIEGEN** token is
the access layer: you pay per generation, directly from your wallet.

```
You ── prompt ──▶ INDIEGEN studio ── pays $INDIEGEN ──▶ generation ──▶ game asset
```

## 2. The studios (how assets are made)

| Studio | Engine | Output |
| --- | --- | --- |
| **Sprite** | OpenRouter (image models) | Two-pass: Pass 1 makes a character anchor, Pass 2 paints every animation keyframe onto a consistent pose-map → coherent sheet |
| **Tiles** | OpenRouter | 13-tile autotile set in one pass, corners reconciled, QA'd by an AI "art director" |
| **Parallax** | OpenRouter | Multi-layer backgrounds, auto-extended to any width, seam-healed |
| **Props** | OpenRouter | Batches of distinct decoration sprites, deduped, packed into an atlas |
| **3D** *(beta)* | Meshy | Text → low-poly model with textures + rig → GLB / FBX / OBJ |

All AI calls run **server-side** through one shared provider key — users never
bring their own key. The server is what holds the keys and meters usage.

## 3. The token interaction (the important part)

INDIEGEN uses **direct pay-per-generation** — there is **no prepaid balance, no
credits, no subscription**. You pay for exactly the asset you generate, at the
moment you generate it.

### Pricing
- Every generation has a **fixed price in USD** (e.g. an image ≈ $0.05; a 3D
  model scales **$2–$15** by prompt complexity).
- That USD price is converted to a **$INDIEGEN amount at the live market price**,
  read from **DexScreener** by the token's mint address (cached ~45s).

```
price_in_tokens = price_in_USD / live_token_price_USD
```

### The payment (what your wallet actually does)
When you click **Generate**, the studio builds **one transaction** that splits
the payment:

- **50% is BURNED** 🔥 (`createBurnCheckedInstruction` — tokens destroyed,
  total supply drops)
- **50% goes to the treasury** (funds the AI/infra costs)

The split ratio is configurable via `NEXT_PUBLIC_BURN_BPS` (5000 = 50%).

```
   your wallet
       │  signs ONE transaction
       ├──▶ 🔥 burn 50%      (supply ↓ forever)
       └──▶ 🏦 treasury 50%  (runs the studio)
```

### Verification (how the server trusts the payment)
1. The wallet sends the transaction and returns its **signature** to the app.
2. The app calls the generation endpoint with that `txSignature`.
3. The server **looks up the transaction on-chain** (via an RPC node — Helius in
   production) and reads how many tokens the wallet actually parted with
   (burn + treasury), values it at the live price, and checks it covers the
   generation's USD price.
4. The server **polls** for up to ~20s in case the transaction hasn't propagated
   to its RPC node yet.

### Pay-on-success (no money for failures)
The payment is **only "spent" once the generation succeeds**. If generation
fails, the payment stays valid — you can **retry for free** until it works. One
payment funds one successful asset (including all of its internal sub-steps,
like a sprite's Pass 1 + Pass 2).

### Anti-abuse
- **Sign-In with Solana**: before anything, you sign a message proving you own
  the wallet (ed25519 signature → session cookie). This stops anyone from
  spending against a wallet they don't control or farming free generations.
- **Rate limiting** per wallet.

## 4. End-to-end lifecycle of one generation

```
1. Connect wallet            → Reown AppKit (Phantom, etc.)
2. Sign in                   → sign message → server issues session
3. Click Generate            → studio computes USD price → tokens at live price
4. Wallet signs payment      → 1 tx: burn 50% + treasury 50%
5. App → /api/generate*      → sends prompt + txSignature
6. Server verifies payment   → reads tx on-chain (Helius), values outflow
7. Server runs generation    → OpenRouter / Meshy
8. On success                → payment marked spent, asset returned
   On failure                → payment stays valid, free retry
9. Export                    → PNG sheets / GLB / FBX / OBJ + manifest
```

## 5. Token lifecycle & supply

Every asset generated **permanently removes** $INDIEGEN from circulation (the
burn share). The more games are built on INDIEGEN, the more supply is destroyed
— **utility-driven deflation**, not a one-off event.

```
generations ↑   →   $INDIEGEN supply ↓   (forever)
```

## 6. Before vs after token launch

The app is built so a single command flips it from free beta to live:

- **Before launch** (no mint configured): generation is **free** (sign-in +
  rate-limit only) so the product is fully usable and demoable.
- **At launch**: set the mint + treasury —
  `npm run set-token -- <MINT> <TREASURY>` — and the app switches to paid
  per-generation. The live price, burn split, and verification all activate
  automatically. No code change.

## 7. Tech / where things live

| Concern | Where |
| --- | --- |
| Token config (mint, treasury, network, burn %) | `app/lib/credits.ts` (env-driven) |
| Live price oracle (DexScreener) | `app/lib/server/tokenPrice.ts` |
| Wallet payment (burn + transfer) | `app/lib/pay.ts` (client) |
| On-chain payment verification | `app/lib/server/payments.ts` |
| Auth gate + pricing | `app/lib/server/charge.ts` |
| Sign-In with Solana | `app/lib/server/auth.ts` |
| Generation endpoints | `app/api/*/route.ts` |
| Public price endpoint | `app/api/price` |

---

**In one sentence:** you sign in with your wallet, pay the exact USD value of
each asset in $INDIEGEN (half of it burned, half to the treasury), the server
verifies that payment on-chain and only charges you when the generation
succeeds — so the token gets scarcer every time the studio is used.
