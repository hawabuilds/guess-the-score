/** Basis points of epoch pot (10000 = 100%). */
export function rankPayoutBps(rank: number): number | null {
  if (rank >= 1 && rank <= 5) return 1000;
  if (rank >= 6 && rank <= 10) return 500;
  if (rank >= 11 && rank <= 20) return 250;
  return null;
}

export function payoutAmountWei(potWei: bigint, rank: number): bigint | null {
  const bps = rankPayoutBps(rank);
  if (bps === null || potWei <= 0n) return null;
  return (potWei * BigInt(bps)) / 10_000n;
}

export function isTopTwentyRank(rank: number): boolean {
  return rank >= 1 && rank <= 20;
}

export function rankToTierLabel(rank: number): string {
  if (rank >= 1 && rank <= 5) return "Tier 1";
  if (rank >= 6 && rank <= 10) return "Tier 2";
  if (rank >= 11 && rank <= 20) return "Tier 3";
  return "Tier 3";
}
