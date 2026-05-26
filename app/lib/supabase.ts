import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { scorePrediction, type MatchScore } from "@/lib/scoring";

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  if (!client) {
    client = createClient(url, anonKey);
  }

  return client;
}

export type PredictionRow = {
  user_id: string;
  user_handle: string;
  match_id: number;
  home_score: number;
  away_score: number;
  points?: number | null;
};

export type MatchStateRow = {
  match_id: number;
  predictions_collected_at: string | null;
  scored_at: string | null;
  final_home_score: number | null;
  final_away_score: number | null;
  match_tweet_id: string | null;
};

export async function savePrediction(row: PredictionRow): Promise<void> {
  const supabase = getSupabaseClient();

  const { data: existing, error: selectError } = await supabase
    .from("predictions")
    .select("user_id")
    .eq("user_id", row.user_id)
    .eq("match_id", row.match_id)
    .maybeSingle();

  if (selectError) {
    throw new Error(selectError.message);
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from("predictions")
      .update({
        user_handle: row.user_handle,
        home_score: row.home_score,
        away_score: row.away_score,
      })
      .eq("user_id", row.user_id)
      .eq("match_id", row.match_id);

    if (updateError) {
      throw new Error(updateError.message);
    }
    return;
  }

  const { error: insertError } = await supabase.from("predictions").insert(row);

  if (insertError) {
    throw new Error(insertError.message);
  }
}

export async function getStoredMatchTweetId(matchId: number): Promise<string | null> {
  const state = await getMatchState(matchId);
  return state?.match_tweet_id?.trim() || null;
}

export async function saveMatchTweetId(matchId: number, tweetId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const existing = await getMatchState(matchId);

  if (existing) {
    const { error } = await supabase
      .from("match_state")
      .update({ match_tweet_id: tweetId })
      .eq("match_id", matchId);

    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase.from("match_state").insert({
    match_id: matchId,
    match_tweet_id: tweetId,
  });

  if (error) throw new Error(error.message);
}

export async function getMatchState(matchId: number): Promise<MatchStateRow | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("match_state")
    .select("*")
    .eq("match_id", matchId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as MatchStateRow | null;
}

export async function markMatchCollected(matchId: number): Promise<void> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();
  const existing = await getMatchState(matchId);

  if (existing) {
    const { error } = await supabase
      .from("match_state")
      .update({ predictions_collected_at: now })
      .eq("match_id", matchId);

    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase.from("match_state").insert({
    match_id: matchId,
    predictions_collected_at: now,
  });

  if (error) throw new Error(error.message);
}

export async function isMatchCollected(matchId: number): Promise<boolean> {
  const state = await getMatchState(matchId);
  return Boolean(state?.predictions_collected_at);
}

export type ScoredPrediction = {
  user_id: string;
  user_handle: string;
  home_score: number;
  away_score: number;
  points: number;
};

export type ScoreMatchResult = {
  matchId: number;
  finalScore: MatchScore;
  predictionsScored: number;
  breakdown: {
    exact: number;
    outcome: number;
    participation: number;
  };
};

export async function scoreMatchPredictions(
  matchId: number,
  finalScore: MatchScore,
): Promise<ScoreMatchResult> {
  const supabase = getSupabaseClient();

  const { data: predictions, error: fetchError } = await supabase
    .from("predictions")
    .select("user_id, user_handle, home_score, away_score")
    .eq("match_id", matchId);

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const breakdown = { exact: 0, outcome: 0, participation: 0 };
  let predictionsScored = 0;

  for (const row of predictions ?? []) {
    const points = scorePrediction(
      { homeScore: row.home_score, awayScore: row.away_score },
      finalScore,
    );

    if (points === 5) breakdown.exact += 1;
    else if (points === 3) breakdown.outcome += 1;
    else breakdown.participation += 1;

    const { error: updateError } = await supabase
      .from("predictions")
      .update({ points })
      .eq("user_id", row.user_id)
      .eq("match_id", matchId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    predictionsScored += 1;
  }

  const now = new Date().toISOString();
  const existing = await getMatchState(matchId);

  if (existing) {
    const { error } = await supabase
      .from("match_state")
      .update({
        scored_at: now,
        final_home_score: finalScore.homeScore,
        final_away_score: finalScore.awayScore,
      })
      .eq("match_id", matchId);

    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("match_state").insert({
      match_id: matchId,
      scored_at: now,
      final_home_score: finalScore.homeScore,
      final_away_score: finalScore.awayScore,
    });

    if (error) throw new Error(error.message);
  }

  return {
    matchId,
    finalScore,
    predictionsScored,
    breakdown,
  };
}

export async function isMatchScored(matchId: number): Promise<boolean> {
  const state = await getMatchState(matchId);
  return Boolean(state?.scored_at);
}

export type LeaderboardEntry = {
  rank: number;
  user_id: string;
  user_handle: string;
  total_points: number;
};

export async function getLeaderboard(limit?: number): Promise<LeaderboardEntry[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("predictions")
    .select("user_id, user_handle, points")
    .not("points", "is", null);

  if (error) {
    throw new Error(error.message);
  }

  const totals = new Map<
    string,
    { user_id: string; user_handle: string; total_points: number }
  >();

  for (const row of data ?? []) {
    if (row.points === null || row.points === undefined) continue;

    const existing = totals.get(row.user_id);
    if (existing) {
      existing.total_points += row.points;
      existing.user_handle = row.user_handle;
    } else {
      totals.set(row.user_id, {
        user_id: row.user_id,
        user_handle: row.user_handle,
        total_points: row.points,
      });
    }
  }

  const sorted = [...totals.values()].sort(
    (a, b) => b.total_points - a.total_points || a.user_handle.localeCompare(b.user_handle),
  );

  const ranked = sorted.map((entry, index) => ({
    rank: index + 1,
    ...entry,
  }));

  return limit ? ranked.slice(0, limit) : ranked;
}
