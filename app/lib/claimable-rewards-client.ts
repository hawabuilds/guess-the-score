import type { ClaimableRewardDto } from "@/app/lib/listUserClaimableRewards";

export type ClaimableRewardsResponse = {
  rewards: ClaimableRewardDto[];
};

export async function fetchClaimableRewards(): Promise<ClaimableRewardDto[]> {
  const response = await fetch("/api/me/claimable-rewards", {
    credentials: "include",
    cache: "no-store",
  });

  const body = (await response.json()) as ClaimableRewardsResponse & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(body.error ?? "Failed to load rewards");
  }

  return body.rewards;
}
