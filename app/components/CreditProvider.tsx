'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react'
import { useAppKitConnection } from '@reown/appkit-adapter-solana/react'
import bs58 from 'bs58'
import { payTokens, type WalletSender } from '@/app/lib/pay'

/**
 * Wallet auth (Sign-In with Solana). No prepaid balance — generation is free
 * until the token launches, then paid per-generation directly from the wallet
 * (see usePayForGeneration). This provider only handles proving wallet ownership
 * so the server can rate-limit and attribute requests.
 */
interface AuthContextValue {
  address?: string
  isConnected: boolean
  /** True once the wallet has proven ownership via a signed message. */
  authed: boolean
  signingIn: boolean
  /** True once the $INDIEGEN token is configured (generation becomes paid). */
  tokenLive: boolean
  signIn: () => Promise<void>
  refresh: () => Promise<void>
  /**
   * Pay for a generation of `usd` value from the wallet. Returns the payment
   * txSignature, or null when generation is still free (token not launched).
   */
  pay: (usd: number) => Promise<string | null>
}

const AuthContext = createContext<AuthContextValue>({
  isConnected: false,
  authed: false,
  signingIn: false,
  tokenLive: false,
  signIn: async () => {},
  refresh: async () => {},
  pay: async () => null,
})

export const useCredits = () => useContext(AuthContext)

type SolanaSigner = {
  signMessage?: (message: Uint8Array) => Promise<Uint8Array | { signature: Uint8Array }>
} & Partial<WalletSender>

export function CreditProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider<SolanaSigner>('solana')
  const { connection } = useAppKitConnection()
  const [authed, setAuthed] = useState(false)
  const [signingIn, setSigningIn] = useState(false)
  const [tokenLive, setTokenLive] = useState(false)
  const signedFor = useRef<string | null>(null)

  useEffect(() => {
    fetch('/api/price')
      .then((r) => r.json())
      .then((d) => setTokenLive(Boolean(d.live)))
      .catch(() => setTokenLive(false))
  }, [])

  /** Pay for a generation; null when still free (token not launched). */
  const pay = useCallback(
    async (usd: number): Promise<string | null> => {
      const p = await fetch('/api/price').then((r) => r.json())
      if (!p.live || !p.mint || !p.treasury || !p.tokenUsd) return null // free
      if (!address || !walletProvider?.sendTransaction || !connection) {
        throw new Error('Wallet not ready — reconnect and try again.')
      }
      return payTokens({
        walletProvider: walletProvider as WalletSender,
        connection,
        payer: address,
        mint: p.mint,
        treasury: p.treasury,
        amountTokens: usd / p.tokenUsd,
      })
    },
    [address, walletProvider, connection]
  )

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/auth/me')
      const d = await r.json()
      setAuthed(Boolean(d.address && d.address === address))
    } catch {
      /* keep last known */
    }
  }, [address])

  const signIn = useCallback(async () => {
    if (!address || !walletProvider?.signMessage) return
    setSigningIn(true)
    try {
      const { issuedAt, message } = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      }).then((r) => r.json())
      if (!message) return
      const signed = await walletProvider.signMessage(new TextEncoder().encode(message))
      const sigBytes = signed instanceof Uint8Array ? signed : signed.signature
      const signature = bs58.encode(sigBytes)
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, issuedAt, signature }),
      })
      if (res.ok) setAuthed(true)
    } catch {
      /* user rejected — stays unauthed, can retry */
    } finally {
      setSigningIn(false)
    }
  }, [address, walletProvider])

  // On connect: check session, auto-prompt sign-in once per address.
  useEffect(() => {
    if (!address) {
      setAuthed(false)
      signedFor.current = null
      return
    }
    let cancelled = false
    ;(async () => {
      await refresh()
      if (cancelled || signedFor.current === address) return
      signedFor.current = address
      const me = await fetch('/api/auth/me').then((r) => r.json()).catch(() => ({}))
      if (!cancelled && me.address !== address) await signIn()
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address])

  return (
    <AuthContext.Provider
      value={{ address, isConnected, authed, signingIn, tokenLive, signIn, refresh, pay }}
    >
      {children}
    </AuthContext.Provider>
  )
}
