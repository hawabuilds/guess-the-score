import {
  countSnapshotRows,
  insertLeaderboardSnapshot,
} from "@/app/lib/leaderboardSnapshots";
import {
  ensurePayoutEpochForSnapshot,
  markPayoutEpochFinalized,
  parsePotWei,
} from "@/app/lib/payoutEpochs";
import { getLeaderboard } from "@/app/lib/supabase";
import { epochIdForDate } from "@/lib/epochId";
import { isTopTwentyRank } from "@/lib/payoutTiers";

export type SnapshotEpochResult =
  | { status: "skipped"; reason: string; epochId: string }
  | {
      status: "created";
      epochId: string;
      rows: number;
      potWei: string;
      finalizedAt: string;
      epochAutoCreated?: boolean;
      potSyncedFromContract?: boolean;
      contractBalanceWei?: string;
      reservedLiabilityWei?: string;
      availablePotWei?: string;
    };

export async function snapshotEpochLeaderboard(
  now: Date = new Date(),
): Promise<SnapshotEpochResult> {
  const epochId = epochIdForDate(now);
  const epochKey = epochId.toString();

  const existingRows = await countSnapshotRows(epochId);
  if (existingRows > 0) {
    return {
      status: "skipped",
      reason: "Snapshot already exists for this epoch",
      epochId: epochKey,
    };
  }

  const ensured = await ensurePayoutEpochForSnapshot(epochId);
  if (!ensured.epoch) {
    return {
      status: "skipped",
      reason: ensured.reason,
      epochId: epochKey,
    };
  }

  const epoch = ensured.epoch;
  const epochAutoCreated = ensured.created;
  const potSyncedFromContract = ensured.potSyncedFromContract;
  const potSync = "potSync" in ensured ? ensured.potSync : undefined;

  if (epoch.finalized_at) {
    return {
      status: "skipped",
      reason: "Epoch already finalized",
      epochId: epochKey,
    };
  }

  const potWei = parsePotWei(epoch.pot_wei);
  if (!potWei) {
    return {
      status: "skipped",
      reason: "Invalid pot_wei on payout_epochs row",
      epochId: epochKey,
    };
  }

  const topTwenty = (await getLeaderboard(20)).filter((entry) =>
    isTopTwentyRank(entry.rank),
  );

  if (topTwenty.length === 0) {
    return {
      status: "skipped",
      reason: "No scored players on leaderboard yet",
      epochId: epochKey,
    };
  }

  const epochOpen = potSync?.epochOpenOnChain;
  if (
    epochOpen &&
    epochOpen.status === "error" &&
    process.env.PAYOUT_OPERATOR_PRIVATE_KEY?.trim()
  ) {
    return {
      status: "skipped",
      reason: `Could not open epoch on payout contract: ${epochOpen.reason}`,
      epochId: epochKey,
    };
  }

  const rows = await insertLeaderboardSnapshot(epochId, topTwenty);
  await markPayoutEpochFinalized(epochId);

  return {
    status: "created",
    epochId: epochKey,
    rows,
    potWei: potWei.toString(),
    finalizedAt: new Date().toISOString(),
    ...(epochAutoCreated ? { epochAutoCreated: true } : {}),
    ...(potSyncedFromContract ? { potSyncedFromContract: true } : {}),
    ...(potSync
      ? {
          contractBalanceWei: potSync.contractBalanceWei,
          reservedLiabilityWei: potSync.reservedLiabilityWei,
          availablePotWei: potSync.availablePotWei,
          epochOpenOnChain: epochOpen,
        }
      : {}),
  };
}
