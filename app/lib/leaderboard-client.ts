export type ApiLeaderboardPlayer = {
  rank: number;
  user_id: string;
  user_handle: string;
  total_points: number;
};

export type ApiLeaderboardResponse = {
  players: ApiLeaderboardPlayer[];
  totalPlayers: number;
};

export function handleToUsername(handle: string): string {
  return handle.replace(/^@/, "");
}

export function handleToInitials(handle: string): string {
  const name = handleToUsername(handle);
  return name.slice(0, 2).toUpperCase();
}

export async function fetchLeaderboard(
  limit?: number,
): Promise<ApiLeaderboardResponse> {
  const query = limit ? `?limit=${limit}` : "";
  const response = await fetch(`/api/leaderboard${query}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Could not load leaderboard");
  }
  return (await response.json()) as ApiLeaderboardResponse;
}

export async function fetchNextMatchStatus(): Promise<string | null> {
  const response = await fetch("/api/matches?next=1", { cache: "no-store" });
  if (!response.ok) return null;
  const data = (await response.json()) as { statusLabel?: string | null };
  return data.statusLabel ?? null;
}
