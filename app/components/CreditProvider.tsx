'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react'
import bs58 from 'bs58'

interface CreditContextValue {
  address?: string
  isConnected: boolean
  /** True once the wallet has proven ownership via a signed message. */
  authed: boolean
  signingIn: boolean
  /** Raw balance in US cents. */
  credits: number | null
  /** Balance in dollars (credits / 100). */
  balanceUsd: number | null
  loading: boolean
  /** Prompt the wallet to sign in (proves ownership → unlocks credits). */
  signIn: () => Promise<void>
  /** Re-fetch the balance from the server session. */
  refresh: () => Promise<void>
  /** Dev faucet — grants test credits (signed-in, non-prod only). */
  buyFaucet: () => Promise<void>
}

const CreditContext = createContext<CreditContextValue>({
  isConnected: false,
  authed: false,
  signingIn: false,
  credits: null,
  balanceUsd: null,
  loading: false,
  signIn: async () => {},
  refresh: async () => {},
  buyFaucet: async () => {},
})

export const useCredits = () => useContext(CreditContext)

type SolanaSigner = {
  signMessage?: (message: Uint8Array) => Promise<Uint8Array | { signature: Uint8Array }>
}

export function CreditProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider<SolanaSigner>('solana')
  const [credits, setCredits] = useState<number | null>(null)
  const [authed, setAuthed] = useState(false)
  const [signingIn, setSigningIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const signedFor = useRef<string | null>(null) // address we already tried to sign in

  // Read balance + auth state from the session cookie.
  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/auth/me')
      const d = await r.json()
      const sessionAddr: string | null = d.address ?? null
      const ok = Boolean(sessionAddr && sessionAddr === address)
      setAuthed(ok)
      setCredits(ok && typeof d.credits === 'number' ? d.credits : null)
    } catch {
      /* keep last known */
    } finally {
      setLoading(false)
    }
  }, [address])

  // Prove wallet ownership: nonce → sign → verify → session cookie.
  const signIn = useCallback(async () => {
    if (!address || !walletProvider?.signMessage) return
    setSigningIn(true)
    try {
      const nonceRes = await fetch('/api/auth/nonce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      })
      const { issuedAt, message } = await nonceRes.json()
      if (!message) return

      const signed = await walletProvider.signMessage(new TextEncoder().encode(message))
      const sigBytes = signed instanceof Uint8Array ? signed : signed.signature
      const signature = bs58.encode(sigBytes)

      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, issuedAt, signature }),
      })
      if (verifyRes.ok) {
        const d = await verifyRes.json()
        setAuthed(true)
        setCredits(typeof d.credits === 'number' ? d.credits : null)
      }
    } catch {
      /* user rejected or wallet error — stays unauthed, can retry */
    } finally {
      setSigningIn(false)
    }
  }, [address, walletProvider])

  const buyFaucet = useCallback(async () => {
    if (!authed) return
    try {
      await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ faucet: true }),
      })
    } finally {
      await refresh()
    }
  }, [authed, refresh])

  // On (dis)connect: reset, check existing session, auto-prompt sign-in once.
  useEffect(() => {
    if (!address) {
      setAuthed(false)
      setCredits(null)
      signedFor.current = null
      return
    }
    let cancelled = false
    ;(async () => {
      await refresh()
      if (cancelled) return
      // auto sign-in once per address if no valid session yet
      if (signedFor.current !== address) {
        signedFor.current = address
        const me = await fetch('/api/auth/me').then((r) => r.json()).catch(() => ({}))
        if (!cancelled && me.address !== address) await signIn()
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address])

  // Keep balance live while authed.
  useEffect(() => {
    if (!authed) return
    const id = setInterval(refresh, 5000)
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(id)
      window.removeEventListener('focus', onFocus)
    }
  }, [authed, refresh])

  return (
    <CreditContext.Provider
      value={{
        address,
        isConnected,
        authed,
        signingIn,
        credits,
        balanceUsd: credits === null ? null : credits / 100,
        loading,
        signIn,
        refresh,
        buyFaucet,
      }}
    >
      {children}
    </CreditContext.Provider>
  )
}
