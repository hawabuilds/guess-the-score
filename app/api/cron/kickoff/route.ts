import { getMatchState, isMatchScored, markMatchCollected } from "@/app/lib/supabase";
import { collectPredictionsForFixture } from "@/lib/collectPredictions";
import { isCronAuthorized } from "@/lib/cronAuth";
import {
  filterFixturesForCollection,
  getFixturesDueForCollection,
} from "@/lib/kickoff";
import { resolveMatchPost } from "@/lib/resolveMatchTweet";
import {
  autoScoreFinishedMatches,
  getFixturesPendingAutoScore,
} from "@/lib/scoreFinishedMatches";
import {
  registryGap,
  syncFixtureRegistryToSupabase,
} from "@/lib/syncFixtureRegistry";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const registry = await syncFixtureRegistryToSupabase();
  const registryMissing = registryGap(registry);

  const dueFixtures = await filterFixturesForCollection(
    getFixturesDueForCollection(),
    async (matchId) => {
      const state = await getMatchState(matchId);
      const at = state?.predictions_collected_at;
      return at ? new Date(at) : null;
    },
  );

  const results: Array<
    | { matchId: number; status: "skipped"; reason: string }
    | { matchId: number; status: "collected"; result: Awaited<ReturnType<typeof collectPredictionsForFixture>> }
    | { matchId: number; status: "error"; error: string }
  > = [];

  for (const fixture of dueFixtures) {
    try {
      if (await isMatchScored(fixture.id)) {
        results.push({
          matchId: fixture.id,
          status: "skipped",
          reason: "Already scored",
        });
        continue;
      }

      const post = await resolveMatchPost(fixture, {
        trustCachedTweet: true,
        discoverMaxPages: 2,
      });
      if (!post) {
        results.push({
          matchId: fixture.id,
          status: "error",
          error: `No match post found for fixture ${fixture.id}`,
        });
        continue;
      }

      const result = await collectPredictionsForFixture(fixture);
      await markMatchCollected(fixture.id);
      results.push({ matchId: fixture.id, status: "collected", result });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Collection failed";
      results.push({ matchId: fixture.id, status: "error", error: message });
    }
  }

  const pendingScore = await getFixturesPendingAutoScore();
  const scoreResults = await autoScoreFinishedMatches(pendingScore);

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    registry: {
      expected: registry.expectedMatchIds,
      registered: registry.registeredMatchIds,
      created: registry.created,
      updated: registry.updated,
      missing: registryMissing,
      skipped: registry.skipped,
      errors: registry.errors,
    },
    dueForCollection: dueFixtures.map((f) => f.id),
    collection: results,
    scoring: scoreResults,
  });
}
