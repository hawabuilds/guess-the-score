import type { Fixture } from "@/app/data/fixtures";
import { FIXTURES, fixtureDateTime } from "@/app/data/fixtures";
import { isMatchScored, scoreMatchPredictions } from "@/app/lib/supabase";
import {
  fetchLiveMatch,
  findExternalFixtureId,
  hasFinalScore,
  isFinishedStatus,
  isApiFootballConfigured,
  type LiveMatchData,
} from "./apiFootball";

/** Wait until ~105 min after kickoff before checking for a final score. */
export const MINUTES_AFTER_KICKOFF_BEFORE_SCORE = 105;

export type AutoScoreResult =
  | { matchId: number; status: "skipped"; reason: string }
  | { matchId: number; status: "scored"; homeScore: number; awayScore: number }
  | { matchId: number; status: "pending"; apiStatus: string }
  | { matchId: number; status: "error"; error: string };

export function isPastScoringWindow(
  fixture: Fixture,
  now: Date = new Date(),
): boolean {
  const kickoffMs = fixtureDateTime(fixture).getTime();
  const windowMs = MINUTES_AFTER_KICKOFF_BEFORE_SCORE * 60 * 1000;
  return now.getTime() - kickoffMs >= windowMs;
}

async function resolveLiveMatch(fixture: Fixture): Promise<LiveMatchData | null> {
  if (fixture.externalFixtureId) {
    return fetchLiveMatch(fixture.externalFixtureId);
  }

  const foundId = await findExternalFixtureId(
    fixture.home,
    fixture.away,
    fixture.date,
  );
  if (!foundId) return null;

  return fetchLiveMatch(foundId);
}

export async function autoScoreFinishedMatches(
  fixtures: Fixture[] = FIXTURES,
): Promise<AutoScoreResult[]> {
  if (!isApiFootballConfigured()) {
    return [
      {
        matchId: 0,
        status: "skipped",
        reason: "FOOTBALL_DATA_API_KEY not configured",
      },
    ];
  }

  const results: AutoScoreResult[] = [];

  for (const fixture of fixtures) {
    try {
      if (await isMatchScored(fixture.id)) {
        results.push({
          matchId: fixture.id,
          status: "skipped",
          reason: "Already scored",
        });
        continue;
      }

      if (!isPastScoringWindow(fixture)) {
        results.push({
          matchId: fixture.id,
          status: "skipped",
          reason: "Match not past scoring window yet",
        });
        continue;
      }

      const live = await resolveLiveMatch(fixture);
      if (!live) {
        results.push({
          matchId: fixture.id,
          status: "skipped",
          reason: "No API fixture found (set externalFixtureId or check API data)",
        });
        continue;
      }

      if (!isFinishedStatus(live.status) || !hasFinalScore(live)) {
        results.push({
          matchId: fixture.id,
          status: "pending",
          apiStatus: live.status,
        });
        continue;
      }

      await scoreMatchPredictions(fixture.id, {
        homeScore: live.homeScore!,
        awayScore: live.awayScore!,
      });

      results.push({
        matchId: fixture.id,
        status: "scored",
        homeScore: live.homeScore!,
        awayScore: live.awayScore!,
      });
    } catch (error) {
      results.push({
        matchId: fixture.id,
        status: "error",
        error: error instanceof Error ? error.message : "Auto-score failed",
      });
    }
  }

  return results;
}
