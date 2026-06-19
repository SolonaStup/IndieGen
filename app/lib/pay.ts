'use client'

import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js'
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createBurnCheckedInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token'

/** Minimal shape of the Reown Solana wallet provider we use. */
export interface WalletSender {
  sendTransaction: (tx: Transaction, connection: Connection) => Promise<string>
}

/**
 * Send `amountTokens` of `mint` from the connected wallet to the treasury.
 * Works for both legacy SPL and Token-2022 (the mint's owner program is
 * detected on-chain). Creates the treasury's token account if missing.
 * Returns the transaction signature once confirmed.
 */
export async function payTokens(opts: {
  walletProvider: WalletSender
  connection: Connection
  payer: string
  mint: string
  treasury: string
  amountTokens: number
  /** Basis points of the payment to burn (rest goes to treasury). */
  burnBps?: number
}): Promise<string> {
  const payer = new PublicKey(opts.payer)
  const mint = new PublicKey(opts.mint)
  const treasury = new PublicKey(opts.treasury)
  const burnBps = Math.max(0, Math.min(10000, opts.burnBps ?? 0))

  // mint account → decimals + owning token program
  const mintInfo = await opts.connection.getParsedAccountInfo(mint)
  if (!mintInfo.value) throw new Error('Token mint not found on this network.')
  const programId = mintInfo.value.owner
  const parsed = mintInfo.value.data as { parsed?: { info?: { decimals?: number } } }
  const decimals = parsed.parsed?.info?.decimals ?? 0

  const total = BigInt(Math.round(opts.amountTokens * 10 ** decimals))
  if (total <= BigInt(0)) throw new Error('Payment amount rounds to zero.')
  const burnAmount = (total * BigInt(burnBps)) / BigInt(10000)
  const treasuryAmount = total - burnAmount

  const payerAta = getAssociatedTokenAddressSync(mint, payer, false, programId)
  const ix: TransactionInstruction[] = []

  // Burn the burn-share.
  if (burnAmount > BigInt(0)) {
    ix.push(createBurnCheckedInstruction(payerAta, mint, payer, burnAmount, decimals, [], programId))
  }
  // Send the rest to the treasury (creating its token account if needed).
  if (treasuryAmount > BigInt(0)) {
    const treasuryAta = getAssociatedTokenAddressSync(mint, treasury, false, programId)
    ix.push(
      createAssociatedTokenAccountIdempotentInstruction(payer, treasuryAta, treasury, mint, programId),
      createTransferCheckedInstruction(payerAta, mint, treasuryAta, payer, treasuryAmount, decimals, [], programId)
    )
  }

  const tx = new Transaction().add(...ix)
  tx.feePayer = payer
  tx.recentBlockhash = (await opts.connection.getLatestBlockhash()).blockhash

  // Send and return the signature immediately. The server waits for the
  // transaction to propagate (it polls), so we don't block the UI on
  // confirmation here (the public RPC's confirm can be slow/flaky).
  return opts.walletProvider.sendTransaction(tx, opts.connection)
}
