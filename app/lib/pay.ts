'use client'

import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import {
  createAssociatedTokenAccountIdempotentInstruction,
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
}): Promise<string> {
  const payer = new PublicKey(opts.payer)
  const mint = new PublicKey(opts.mint)
  const treasury = new PublicKey(opts.treasury)

  // mint account → decimals + owning token program
  const mintInfo = await opts.connection.getParsedAccountInfo(mint)
  if (!mintInfo.value) throw new Error('Token mint not found on this network.')
  const programId = mintInfo.value.owner
  const parsed = mintInfo.value.data as { parsed?: { info?: { decimals?: number } } }
  const decimals = parsed.parsed?.info?.decimals ?? 0

  const amount = BigInt(Math.round(opts.amountTokens * 10 ** decimals))
  if (amount <= BigInt(0)) throw new Error('Payment amount rounds to zero.')

  const payerAta = getAssociatedTokenAddressSync(mint, payer, false, programId)
  const treasuryAta = getAssociatedTokenAddressSync(mint, treasury, false, programId)

  const tx = new Transaction().add(
    createAssociatedTokenAccountIdempotentInstruction(payer, treasuryAta, treasury, mint, programId),
    createTransferCheckedInstruction(payerAta, mint, treasuryAta, payer, amount, decimals, [], programId)
  )
  tx.feePayer = payer
  tx.recentBlockhash = (await opts.connection.getLatestBlockhash()).blockhash

  const signature = await opts.walletProvider.sendTransaction(tx, opts.connection)
  await opts.connection.confirmTransaction(signature, 'confirmed')
  return signature
}
