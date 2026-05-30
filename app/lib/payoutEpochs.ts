import { getSupabaseAdminClient } from "@/app/lib/supabase";
import { getAvailableEpochPotWei } from "@/lib/payoutLiability";
import {
  ensureEpochOpenedOnChain,
  type EnsureEpochOpenResult,
} from "@/lib/payoutOpenEpoch";

export type PayoutEpochRow = {
  epoch_id: number;
  pot_wei: string;
  finalized_at: string | null;
  created_at: string;
};

export async function getPayoutEpoch(
  epochId: bigint,
): Promise<PayoutEpochRow | null> {
  const supabase = getSupabaseAdminClient();
  const epochNumeric = Number(epochId);

  const { data, error } = await supabase
    .from("payout_epochs")
    .select("epoch_id, pot_wei, finalized_at, created_at")
    .eq("epoch_id", epochNumeric)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as PayoutEpochRow | null) ?? null;
}

export async function upsertPayoutEpochPot(
  epochId: bigint,
  potWei: bigint,
): Promise<PayoutEpochRow> {
  const supabase = getSupabaseAdminClient();
  const epochNumeric = Number(epochId);
  const now = new Date().toISOString();

  const existing = await getPayoutEpoch(epochId);
  if (existing?.finalized_at) {
    throw new Error(`Epoch ${epochNumeric} is already finalized`);
  }

  const { data, error } = await supabase
    .from("payout_epochs")
    .upsert(
      {
        epoch_id: epochNumeric,
        pot_wei: potWei.toString(),
        ...(existing ? {} : { created_at: now }),
      },
      { onConflict: "epoch_id" },
    )
    .select("epoch_id, pot_wei, finalized_at, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as PayoutEpochRow;
}

export async function markPayoutEpochFinalized(
  epochId: bigint,
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const epochNumeric = Number(epochId);
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("payout_epochs")
    .update({ finalized_at: now })
    .eq("epoch_id", epochNumeric);

  if (error) {
    throw new Error(error.message);
  }
}

export function parsePotWei(raw: string | null | undefined): bigint | null {
  if (!raw?.trim()) return null;
  try {
    const value = BigInt(raw.trim());
    return value > 0n ? value : null;
  } catch {
    return null;
  }
}

export type EpochPotSyncMeta = {
  contractBalanceWei: string;
  reservedLiabilityWei: string;
  totalReservedOnChainWei: string;
  availablePotWei: string;
  epochOpenOnChain?: EnsureEpochOpenResult;
};

/**
 * Ensures today's epoch row with pot_wei = contract balance minus unclaimed prior vouchers.
 * Refreshes pot_wei on each snapshot run until the epoch is finalized.
 */
export async function ensurePayoutEpochForSnapshot(
  epochId: bigint,
): Promise<
  | {
      epoch: PayoutEpochRow;
      created: boolean;
      potSyncedFromContract: boolean;
      potSync?: EpochPotSyncMeta;
    }
  | { epoch: null; created: false; reason: string }
> {
  const existing = await getPayoutEpoch(epochId);
  if (existing?.finalized_at) {
    return { epoch: existing, created: false, potSyncedFromContract: false };
  }

  const available = await getAvailableEpochPotWei(epochId);
  if (!available) {
    return {
      epoch: null,
      created: false,
      reason:
        "Payout contract not configured (PAYOUT_CONTRACT_ADDRESS + PAYOUT_CHAIN_ID)",
    };
  }

  if (available.availablePotWei <= 0n) {
    const reserved = available.reservedLiabilityWei.toString();
    const balance = available.contractBalanceWei.toString();
    return {
      epoch: null,
      created: false,
      reason:
        available.reservedLiabilityWei > 0n
          ? `No new epoch pot — contract holds ${balance} wei but ${reserved} wei is reserved for unclaimed prior winners (fund more or wait for claims)`
          : "Payout contract has no BNB available for a new epoch — fund the contract before snapshot",
    };
  }

  const epoch = await upsertPayoutEpochPot(epochId, available.availablePotWei);
  const epochOpenOnChain = await ensureEpochOpenedOnChain(
    epochId,
    available.availablePotWei,
  );
  const potSync: EpochPotSyncMeta = {
    contractBalanceWei: available.contractBalanceWei.toString(),
    reservedLiabilityWei: available.reservedLiabilityWei.toString(),
    totalReservedOnChainWei: available.totalReservedOnChainWei.toString(),
    availablePotWei: available.availablePotWei.toString(),
    epochOpenOnChain,
  };

  return {
    epoch,
    created: !existing,
    potSyncedFromContract: true,
    potSync,
  };
}
