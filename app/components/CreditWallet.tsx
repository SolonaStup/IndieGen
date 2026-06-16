'use client'

import { useAppKit } from '@reown/appkit/react'
import { useCredits } from '@/app/components/CreditProvider'
import { Icons } from '@/app/components/icons'

function shortAddr(a?: string) {
  if (!a) return ''
  return `${a.slice(0, 4)}…${a.slice(-4)}`
}

/** Top-bar wallet + credit widget for the studio. */
export function CreditWallet() {
  const { open } = useAppKit()
  const { isConnected, address, balanceUsd, loading, buyFaucet } = useCredits()

  if (!isConnected) {
    return (
      <button className="btn btn-primary" onClick={() => open()}>
        Connect Wallet
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center gap-1.5 rounded-md border border-[var(--accent-border)] bg-[var(--accent-bg)] px-2.5 py-1.5"
        title="Prepaid balance (USD)"
      >
        <Icons.Sparkle size={13} />
        <span className="font-mono text-[13px] font-semibold text-[var(--accent)]">
          {loading && balanceUsd === null ? '…' : `$${(balanceUsd ?? 0).toFixed(2)}`}
        </span>
      </div>
      <button className="btn btn-secondary" onClick={buyFaucet} title="Add test balance (dev faucet)">
        + Add
      </button>
      <button
        className="btn btn-ghost font-mono text-[12px]"
        onClick={() => open({ view: 'Account' })}
        title="Wallet account"
      >
        {shortAddr(address)}
      </button>
    </div>
  )
}
