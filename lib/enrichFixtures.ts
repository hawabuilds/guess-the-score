import type { Fixture } from "@/app/data/fixtures";
import {
  fetchLiveMatch,
  findExternalFixtureId,
  isApiFootballConfigured,
  isFinishedStatus,
  type LiveMatchData,
} from "./apiFootball";

export type EnrichedFixture = Fixture & {
  live: LiveMatchData | null;
  apiConfigured: boolean;
};

async function resolveLive(fixture: Fixture): Promise<LiveMatchData | null> {
  if (!isApiFootballConfigured()) return null;

  try {
    if (fixture.externalFixtureId) {
      return await fetchLiveMatch(fixture.externalFixtureId);
    }

    const foundId = await findExternalFixtureId(
      fixture.home,
      fixture.away,
      fixture.date,
    );
    if (!foundId) return null;

    return await fetchLiveMatch(foundId);
  } catch {
    return null;
  }
}

export async function enrichFixture(fixture: Fixture): Promise<EnrichedFixture> {
  const live = await resolveLive(fixture);
  return {
    ...fixture,
    live,
    apiConfigured: isApiFootballConfigured(),
  };
}

export async function enrichFixtures(
  fixtures: Fixture[],
): Promise<EnrichedFixture[]> {
  return Promise.all(fixtures.map((fixture) => enrichFixture(fixture)));
}

export function formatMatchStatus(live: LiveMatchData | null): string | null {
  if (!live) return null;

  if (isFinishedStatus(live.status)) {
    return `FT ${live.homeScore}–${live.awayScore}`;
  }

  if (live.status === "NS") return "Not started";
  if (live.status === "HT") return `HT ${live.homeScore ?? 0}–${live.awayScore ?? 0}`;
  if (live.elapsed !== null) {
    return `LIVE ${live.elapsed}' · ${live.homeScore ?? 0}–${live.awayScore ?? 0}`;
  }

  return live.status;
}
