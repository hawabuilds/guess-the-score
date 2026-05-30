export type Fixture = {
  id: number;
  home: string;
  away: string;
  date: string;
  time: string;
  group: string;
  /** When true, match is void — no collection, scoring, or UI listing. */
  cancelled?: boolean;
  tweetId?: string;
  /** api-football.com fixture id for live scores + auto-scoring. */
  externalFixtureId?: number;
  /** Set when the final score is known — used by score-predictions / score cron. */
  result?: {
    homeScore: number;
    awayScore: number;
  };
};

/**
 * Flag codes for country-flag-icons/react/3x2 (ISO 3166-1 alpha-2 or GB subdivisions).
 * UK home nations use GB_ENG, GB_SCT, GB_WLS, GB_NIR — not the Union Jack (GB).
 */
export type CountryCode = string;

export const TEAM_COUNTRY_CODES: Record<string, CountryCode> = {
  Iran: "IR",
  Gambia: "GM",
  "South Africa": "ZA",
  Nicaragua: "NI",
  Iraq: "IQ",
  Andorra: "AD",
  Lebanon: "LB",
  Sudan: "SD",
  "Bosnia & Herzegovina": "BA",
  "FYR Macedonia": "MK",
  Scotland: "GB_SCT",
  England: "GB_ENG",
  Wales: "GB_WLS",
  "Northern Ireland": "GB_NIR",
  "Curaçao": "CW",
  Poland: "PL",
  Ukraine: "UA",
  Germany: "DE",
  Finland: "FI",
  USA: "US",
  Senegal: "SN",
  Brazil: "BR",
  Panama: "PA",
};

export function getTeamCountryCode(team: string): CountryCode | null {
  if (TEAM_COUNTRY_CODES[team]) {
    return TEAM_COUNTRY_CODES[team]!;
  }

  const lower = team.trim().toLowerCase();
  if (lower === "scotland" || lower.includes("scotland")) return "GB_SCT";
  if (lower === "england" || lower.includes("england")) return "GB_ENG";
  if (lower === "wales" || lower.includes("wales")) return "GB_WLS";
  if (lower.includes("northern ireland")) return "GB_NIR";

  return null;
}

/**
 * Do not reuse ids already stored in Supabase (predictions + leaderboard are per match_id).
 * Ids 1–2 = 28 May slate; 3–4 may exist from earlier tests — append new days with new ids only.
 */
export const MATCH_ID_LEGACY_RESERVED_THROUGH = 5;

/** Active + recent slates — append new days with new match_ids only (see MATCH_ID_LEGACY_RESERVED_THROUGH). */
export const FIXTURES: Fixture[] = [
  /** Fri 29 May 2026 UTC */
  {
    id: 6,
    home: "Iran",
    away: "Gambia",
    date: "2026-05-29",
    time: "15:30",
    group: "International Friendly",
    externalFixtureId: 1544803,
  },
  {
    id: 7,
    home: "South Africa",
    away: "Nicaragua",
    date: "2026-05-29",
    time: "16:00",
    group: "International Friendly",
    externalFixtureId: 1543817,
  },
  {
    id: 8,
    home: "Iraq",
    away: "Andorra",
    date: "2026-05-29",
    time: "16:00",
    group: "International Friendly",
    externalFixtureId: 1544356,
  },
  {
    id: 9,
    home: "Lebanon",
    away: "Sudan",
    date: "2026-05-29",
    time: "16:00",
    group: "International Friendly",
    externalFixtureId: 1546837,
    cancelled: true,
  },
  {
    id: 10,
    home: "Bosnia & Herzegovina",
    away: "FYR Macedonia",
    date: "2026-05-29",
    time: "18:30",
    group: "International Friendly",
    externalFixtureId: 1540947,
    result: { homeScore: 0, awayScore: 0 },
  },
  /** Sat 30 May 2026 UTC */
  {
    id: 11,
    home: "Scotland",
    away: "Curaçao",
    date: "2026-05-30",
    time: "12:00",
    group: "International Friendly",
    externalFixtureId: 1511779,
    /** @guessthescoreX match post — avoids X search when API mangles Curaçao in tweet text */
    tweetId: "2060501091976933875",
  },
  {
    id: 12,
    home: "Paris Saint Germain",
    away: "Arsenal",
    date: "2026-05-30",
    time: "16:00",
    group: "UEFA Champions League Final",
    externalFixtureId: 1544371,
    /** Regulation score 1–1 (API-Football); used if auto-score cron missed PEN/FT window */
    result: { homeScore: 1, awayScore: 1 },
  },
  /** Sun 31 May 2026 UTC — International Friendlies */
  {
    id: 13,
    home: "Poland",
    away: "Ukraine",
    date: "2026-05-31",
    time: "15:30",
    group: "International Friendly",
    externalFixtureId: 1544805,
  },
  {
    id: 14,
    home: "Germany",
    away: "Finland",
    date: "2026-05-31",
    time: "18:45",
    group: "International Friendly",
    externalFixtureId: 1501818,
  },
  {
    id: 15,
    home: "USA",
    away: "Senegal",
    date: "2026-05-31",
    time: "19:30",
    group: "International Friendly",
    externalFixtureId: 1503008,
  },
  {
    id: 16,
    home: "Brazil",
    away: "Panama",
    date: "2026-05-31",
    time: "21:30",
    group: "International Friendly",
    externalFixtureId: 1536926,
  },
];

export function getFixtureById(
  matchId: number,
  fixtures: Fixture[] = FIXTURES,
): Fixture | undefined {
  return fixtures.find((fixture) => fixture.id === matchId);
}

/** Stable id for the teams on a match row — invalidates cached tweet ids when fixtures change. */
export function fixtureCacheKey(
  fixture: Pick<Fixture, "home" | "away" | "date">,
): string {
  return `${fixture.home}|${fixture.away}|${fixture.date}`;
}

export function fixtureDateTime(fixture: Fixture): Date {
  return new Date(`${fixture.date}T${fixture.time}:00Z`);
}

/** True while kickoff is still in the future (predictions open). */
export function isFixtureCancelled(fixture: Pick<Fixture, "cancelled">): boolean {
  return Boolean(fixture.cancelled);
}

export function getActiveFixtures(
  fixtures: Fixture[] = FIXTURES,
): Fixture[] {
  return fixtures.filter((fixture) => !isFixtureCancelled(fixture));
}

export function isFixtureNotStarted(
  fixture: Fixture,
  now: Date = new Date(),
): boolean {
  if (isFixtureCancelled(fixture)) return false;
  return fixtureDateTime(fixture) > now;
}

export function getUpcomingFixtures(
  fixtures: Fixture[] = FIXTURES,
  now: Date = new Date(),
): Fixture[] {
  return getActiveFixtures(fixtures)
    .filter((fixture) => isFixtureNotStarted(fixture, now))
    .sort(
      (a, b) => fixtureDateTime(a).getTime() - fixtureDateTime(b).getTime(),
    );
}

export function getNextFixture(
  fixtures: Fixture[] = FIXTURES,
  now: Date = new Date(),
): Fixture | null {
  return getUpcomingFixtures(fixtures, now)[0] ?? null;
}

export function fixtureKickoffKey(
  fixture: Pick<Fixture, "date" | "time">,
): string {
  return `${fixture.date}T${fixture.time}`;
}

/** Earliest upcoming kickoff slot — one fixture, or all sharing that time. */
export function getNextKickoffSlotFixtures<T extends Pick<Fixture, "date" | "time">>(
  upcoming: T[],
): T[] {
  if (upcoming.length === 0) return [];
  const slot = fixtureKickoffKey(upcoming[0]!);
  return upcoming.filter((fixture) => fixtureKickoffKey(fixture) === slot);
}

/** Upcoming fixtures on a given UTC date (YYYY-MM-DD). */
export function getUpcomingFixturesOnDate<T extends Pick<Fixture, "date">>(
  upcoming: T[],
  date: string,
): T[] {
  return upcoming.filter((fixture) => fixture.date === date);
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
