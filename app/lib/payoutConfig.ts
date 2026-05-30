"use client";

import { getAddress, type Address } from "viem";
import { bsc, bscTestnet } from "wagmi/chains";

export const PAYOUT_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_PAYOUT_CHAIN_ID ?? "97",
);

export const PAYOUT_CHAIN = PAYOUT_CHAIN_ID === 97 ? bscTestnet : bsc;

export function getPayoutContractAddress(): Address | null {
  const raw = process.env.NEXT_PUBLIC_PAYOUT_CONTRACT_ADDRESS?.trim();
  if (!raw) return null;
  try {
    return getAddress(raw);
  } catch {
    return null;
  }
}
