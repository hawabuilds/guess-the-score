import { FIXTURES } from "@/app/data/fixtures";
import { isMatchCollected, markMatchCollected } from "@/app/lib/supabase";
import { collectPredictionsForFixture } from "@/lib/collectPredictions";
import { isCronAuthorized } from "@/lib/cronAuth";
import { getFixturesDueForCollection } from "@/lib/kickoff";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dueFixtures = getFixturesDueForCollection();
  const results: Array<
    | { matchId: number; status: "skipped"; reason: string }
    | { matchId: number; status: "collected"; result: Awaited<ReturnType<typeof collectPredictionsForFixture>> }
    | { matchId: number; status: "error"; error: string }
  > = [];

  for (const fixture of dueFixtures) {
    try {
      if (await isMatchCollected(fixture.id)) {
        results.push({
          matchId: fixture.id,
          status: "skipped",
          reason: "Already collected at kickoff",
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

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    fixturesWithTweet: FIXTURES.filter((f) => f.tweetId?.trim()).length,
    dueForCollection: dueFixtures.map((f) => f.id),
    results,
  });
}
