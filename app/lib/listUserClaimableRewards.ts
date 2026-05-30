import { getSupabaseAdminClient } from "@/app/lib/supabase";
import { parsePotWei } from "@/app/lib/payoutEpochs";
import { formatEpochDayLabels } from "@/lib/epochId";
import {
  isVoucherClaimedOnChain,
  readPublicPayoutConfig,
} from "@/lib/payoutContract";
import { payoutAmountWei, rankToTierLabel } from "@/lib/payoutTiers";
import { computeVoucherId } from "@/lib/payoutVoucher";
import { resolveSnapshotWinner } from "@/lib/resolveSnapshotWinner";

type SessionLike = {
  user?: {
    id?: string | number;
    name?: string | null;
    username?: string | null;
  } | null;
} | null;

export type ClaimableRewardDto = {
  id: string;
  epochId: string;
  rank: number;
  tier: string;
  pts: number;
  amountWei: string;
  bnb: number;
  claimed: boolean;
  day: string;
  date: string;
  finalizedAt: string;
};

export async function listUserClaimableRewards(
  session: SessionLike,
): Promise<ClaimableRewardDto[]> {
  const supabase = getSupabaseAdminClient();
  const { data: epochs, error } = await supabase
    .from("payout_epochs")
    .select("epoch_id, pot_wei, finalized_at")
    .not("finalized_at", "is", null)
    .order("epoch_id", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  if (!epochs?.length) return [];

  const payoutConfig = readPublicPayoutConfig();
  const rewards: ClaimableRewardDto[] = [];

  for (const epoch of epochs) {
    const epochId = BigInt(epoch.epoch_id);
    const snapshot = await resolveSnapshotWinner(epochId, session);
    if (!snapshot) continue;

    const potWei = parsePotWei(epoch.pot_wei);
    if (!potWei) continue;

    const amountWei = payoutAmountWei(potWei, snapshot.rank);
    if (!amountWei || amountWei <= 0n) continue;

    const voucherId = computeVoucherId(epochId, snapshot.user_id);
    let claimed = false;
    if (payoutConfig) {
      try {
        claimed = await isVoucherClaimedOnChain(payoutConfig, voucherId);
      } catch {
        claimed = false;
      }
    }

    const { day, date } = formatEpochDayLabels(epochId);

    rewards.push({
      id: String(epoch.epoch_id),
      epochId: String(epoch.epoch_id),
      rank: snapshot.rank,
      tier: rankToTierLabel(snapshot.rank),
      pts: snapshot.total_points,
      amountWei: amountWei.toString(),
      bnb: Number(amountWei) / 1e18,
      claimed,
      day,
      date,
      finalizedAt: epoch.finalized_at as string,
    });
  }

  return rewards;
}
