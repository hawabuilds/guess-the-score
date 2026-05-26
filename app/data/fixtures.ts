export type Fixture = {
  id: number;
  home: string;
  away: string;
  date: string;
  time: string;
  group: string;
  tweetId?: string;
  /** football-data.org match id for live scores + auto-scoring. */
  externalFixtureId?: number;
  /** Set when the final score is known — used by score-predictions / score cron. */
  result?: {
    homeScore: number;
    awayScore: number;
  };
};

export type CountryCode = "FR";

export const TEAM_COUNTRY_CODES: Record<string, CountryCode> = {
  "Saint-Étienne": "FR",
  Nice: "FR",
};

export function getTeamCountryCode(team: string): CountryCode {
  return TEAM_COUNTRY_CODES[team] ?? "FR";
}

/** Ligue 1 relegation playoff — first leg, Tue 26 May 2026 18:45 UTC. */
export const FIXTURES: Fixture[] = [
  {
    id: 1,
    home: "Saint-Étienne",
    away: "Nice",
    date: "2026-05-26",
    time: "18:45",
    group: "L1 Playoff",
    tweetId: "",
  },
];

export function getFixtureById(
  matchId: number,
  fixtures: Fixture[] = FIXTURES,
): Fixture | undefined {
  return fixtures.find((fixture) => fixture.id === matchId);
}

export function fixtureDateTime(fixture: Fixture): Date {
  return new Date(`${fixture.date}T${fixture.time}:00Z`);
}

export function getNextFixture(fixtures: Fixture[] = FIXTURES): Fixture {
  const now = new Date();
  const upcoming = fixtures
    .filter((fixture) => fixtureDateTime(fixture) >= now)
    .sort(
      (a, b) => fixtureDateTime(a).getTime() - fixtureDateTime(b).getTime(),
    );

  return upcoming[0] ?? fixtures[0]!;
}

export function formatKickoffUtc(fixture: Fixture): string {
  return `${fixture.time} UTC`;
}

export function formatFixtureLabel(fixture: Fixture): string {
  return `${fixture.home} vs ${fixture.away}`;
}

export function formatFixtureModalSub(fixture: Fixture): string {
  return `${formatFixtureLabel(fixture)} · ${formatFixtureDateShort(fixture.date)}, ${formatKickoffUtc(fixture)}`;
}

export function formatExampleScore(fixture: Fixture): string {
  return `${fixture.home} 2 – 1 ${fixture.away}`;
}

export function formatGroupLine(fixture: Fixture): string {
  return `${formatKickoffUtc(fixture)} · ${fixture.group}`;
}

export function formatFixtureDateShort(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatNextMatchBadge(fixture: Fixture): string {
  const today = new Date();
  const kickoff = fixtureDateTime(fixture);
  const isToday =
    kickoff.getUTCFullYear() === today.getUTCFullYear() &&
    kickoff.getUTCMonth() === today.getUTCMonth() &&
    kickoff.getUTCDate() === today.getUTCDate();

  return isToday ? "Today" : formatFixtureDateShort(fixture.date);
}
