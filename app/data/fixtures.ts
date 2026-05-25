export type Fixture = {
  id: number;
  home: string;
  away: string;
  date: string;
  time: string;
  group: string;
};

export type CountryCode =
  | "MX"
  | "ZA"
  | "CA"
  | "BA"
  | "US"
  | "PY"
  | "BR"
  | "MA"
  | "ES"
  | "CV"
  | "AR"
  | "DZ";

export const TEAM_COUNTRY_CODES: Record<string, CountryCode> = {
  Mexico: "MX",
  "South Africa": "ZA",
  Canada: "CA",
  "Bosnia & Herzegovina": "BA",
  USA: "US",
  Paraguay: "PY",
  Brazil: "BR",
  Morocco: "MA",
  Spain: "ES",
  "Cape Verde": "CV",
  Argentina: "AR",
  Algeria: "DZ",
};

export function getTeamCountryCode(team: string): CountryCode {
  return TEAM_COUNTRY_CODES[team] ?? "BR";
}

export const FIXTURES: Fixture[] = [
  {
    id: 1,
    home: "Mexico",
    away: "South Africa",
    date: "2026-06-11",
    time: "19:00",
    group: "A",
  },
  {
    id: 2,
    home: "Canada",
    away: "Bosnia & Herzegovina",
    date: "2026-06-12",
    time: "22:00",
    group: "B",
  },
  {
    id: 3,
    home: "USA",
    away: "Paraguay",
    date: "2026-06-13",
    time: "00:00",
    group: "D",
  },
  {
    id: 4,
    home: "Brazil",
    away: "Morocco",
    date: "2026-06-13",
    time: "22:00",
    group: "C",
  },
  {
    id: 5,
    home: "Spain",
    away: "Cape Verde",
    date: "2026-06-15",
    time: "16:00",
    group: "H",
  },
  {
    id: 6,
    home: "Argentina",
    away: "Algeria",
    date: "2026-06-16",
    time: "23:00",
    group: "J",
  },
];

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
  return `${formatKickoffUtc(fixture)} · Group ${fixture.group}`;
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
