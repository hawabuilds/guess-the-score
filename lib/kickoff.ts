import {
  FIXTURES,
  fixtureDateTime,
  type Fixture,
} from "../app/data/fixtures";

/** How long after kickoff we still auto-collect replies (cron may run every 5 min). */
export const KICKOFF_COLLECTION_WINDOW_MS = 15 * 60 * 1000;

export function fixtureHasTweet(fixture: Fixture): boolean {
  return Boolean(fixture.tweetId?.trim());
}

/**
 * Fixtures whose kickoff has passed but is still within the collection window.
 * Used by the kickoff cron to trigger reply collection once per match.
 */
export function getFixturesDueForCollection(
  now: Date = new Date(),
  fixtures: Fixture[] = FIXTURES,
  windowMs: number = KICKOFF_COLLECTION_WINDOW_MS,
): Fixture[] {
  const nowMs = now.getTime();

  return fixtures.filter((fixture) => {
    if (!fixtureHasTweet(fixture)) return false;

    const kickoffMs = fixtureDateTime(fixture).getTime();
    const elapsedMs = nowMs - kickoffMs;
    return elapsedMs >= 0 && elapsedMs <= windowMs;
  });
}
