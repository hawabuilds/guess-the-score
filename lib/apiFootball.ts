export type LiveMatchData = {
  externalFixtureId: number;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  elapsed: number | null;
};

/** Normalized fixture row used by scoring + live UI. */
export type FootballDataMatch = {
  id: number;
  status: string;
  minute?: number | null;
  homeTeam: { name: string };
  awayTeam: { name: string };
  score?: {
    fullTime?: { home: number | null; away: number | null };
    halfTime?: { home: number | null; away: number | null };
  };
};

import {
  ApiFootballBudgetError,
  canUseApiFootball,
  getCachedFixture,
  markQuotaExhausted,
  setCachedFixture,
  updateQuotaFromHeaders,
} from "./apiFootballCache";

const API_BASE = "https://v3.football.api-sports.io";

/** API key from https://www.api-football.com/ */
function getApiKey(): string | null {
  return process.env.API_FOOTBALL_KEY?.trim() || null;
}

export function isApiFootballConfigured(): boolean {
  return Boolean(getApiKey());
}

export function isFootballDataConfigured(): boolean {
  return isApiFootballConfigured();
}

type ApiSportsFixtureRow = {
  fixture: {
    id: number;
    status: { short: string; elapsed: number | null };
  };
  teams: { home: { name: string }; away: { name: string } };
  goals: { home: number | null; away: number | null };
  score: {
    fulltime: { home: number | null; away: number | null };
    halftime: { home: number | null; away: number | null };
  };
};

type ApiSportsFixturesResponse = {
  response?: ApiSportsFixtureRow[];
  errors?: Record<string, string>;
};

async function apiFetch(path: string): Promise<Response> {
  const key = getApiKey();
  if (!key) {
    throw new Error("API_FOOTBALL_KEY is not configured");
  }

  if (!canUseApiFootball()) {
    throw new ApiFootballBudgetError(
      "API-Football daily quota reserve reached — set fixture.result or wait for reset",
    );
  }

  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "x-apisports-key": key,
    },
    cache: "no-store",
  });

  updateQuotaFromHeaders(response.headers);

  return response;
}

async function parseFixturesResponse(
  response: Response,
): Promise<ApiSportsFixtureRow[]> {
  if (response.status === 404) return [];

  const body = (await response.json()) as ApiSportsFixturesResponse;

  if (body.errors && Object.keys(body.errors).length > 0) {
    const message = Object.values(body.errors).join("; ");
    if (/limit|quota|requests/i.test(message)) {
      markQuotaExhausted();
      throw new ApiFootballBudgetError(message);
    }
    throw new Error(`api-football.com error: ${message}`);
  }

  if (!response.ok) {
    throw new Error(`api-football.com error: ${response.status}`);
  }

  return body.response ?? [];
}

function normalizeTeamName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function teamNamesMatch(apiName: string, fixtureName: string): boolean {
  const a = normalizeTeamName(apiName);
  const b = normalizeTeamName(fixtureName);
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;

  const aliases: Record<string, string[]> = {
    usa: ["united states", "u s a", "us"],
    "bosnia herzegovina": ["bosnia", "bih", "bosnia & herzegovina"],
    "cape verde": ["cabo verde"],
    "saint etienne": ["st etienne", "st. etienne", "asse", "saint-etienne"],
    nice: ["ogc nice"],
    flamengo: ["cr flamengo", "clube de regatas do flamengo"],
    cusco: ["cusco fc", "cienciano"],
    "crystal palace": ["palace"],
    "rayo vallecano": ["rayo"],
    "buriram united": ["buriram"],
    selangor: ["selangor fa"],
    "fyr macedonia": ["north macedonia", "macedonia", "mk"],
    scotland: ["scotland"],
    curacao: ["curaçao", "curacao"],
    arsenal: ["arsenal", "afc arsenal"],
    "paris saint germain": ["psg", "paris sg", "paris saint-germain"],
    "south africa": ["rsa", "bafana bafana"],
    "republic of ireland": ["rep of ireland", "ireland"],
    iran: ["ir iran", "team melli"],
    gambia: ["gambia national"],
    nicaragua: ["nicaragua national"],
    iraq: ["iraq national"],
    andorra: ["andorra national"],
    lebanon: ["lebanon national"],
    sudan: ["sudan national"],
  };

  for (const [key, values] of Object.entries(aliases)) {
    const names = [key, ...values];
    const aHit = names.some((n) => a.includes(n) || n.includes(a));
    const bHit = names.some((n) => b.includes(n) || n.includes(b));
    if (aHit && bHit) return true;
  }

  return false;
}

function normalizeFixtureRow(row: ApiSportsFixtureRow): FootballDataMatch {
  const fulltime = row.score.fulltime;
  const halftime = row.score.halftime;
  const hasFulltime =
    fulltime.home != null && fulltime.away != null;
  const hasLiveGoals = row.goals.home != null && row.goals.away != null;

  return {
    id: row.fixture.id,
    status: row.fixture.status.short,
    minute: row.fixture.status.elapsed,
    homeTeam: { name: row.teams.home.name },
    awayTeam: { name: row.teams.away.name },
    score: {
      fullTime: hasFulltime
        ? { home: fulltime.home, away: fulltime.away }
        : hasLiveGoals
          ? { home: row.goals.home, away: row.goals.away }
          : undefined,
      halfTime:
        halftime.home != null && halftime.away != null
          ? { home: halftime.home, away: halftime.away }
          : undefined,
    },
  };
}

function extractScores(match: FootballDataMatch): {
  homeScore: number | null;
  awayScore: number | null;
} {
  const fullTime = match.score?.fullTime;
  if (fullTime?.home != null && fullTime?.away != null) {
    return { homeScore: fullTime.home, awayScore: fullTime.away };
  }

  return { homeScore: null, awayScore: null };
}

/** Map api-football.com status.short to UI labels. */
function mapStatus(status: string): string {
  switch (status) {
    case "FT":
    case "AET":
    case "PEN":
      return "FT";
    case "HT":
    case "BT":
      return "HT";
    case "1H":
    case "2H":
    case "ET":
    case "P":
    case "LIVE":
      return "LIVE";
    case "NS":
    case "TBD":
    case "PST":
      return "NS";
    default:
      return status;
  }
}

export function mapMatchRow(match: FootballDataMatch): LiveMatchData {
  const { homeScore, awayScore } = extractScores(match);

  return {
    externalFixtureId: match.id,
    status: mapStatus(match.status),
    homeScore,
    awayScore,
    elapsed: match.minute ?? null,
  };
}

export async function fetchApiMatch(
  externalFixtureId: number,
): Promise<FootballDataMatch | null> {
  const cached = getCachedFixture(externalFixtureId);
  if (cached !== undefined) return cached;

  try {
    const rows = await parseFixturesResponse(
      await apiFetch(`/fixtures?id=${externalFixtureId}`),
    );
    const row = rows[0];
    const match = row ? normalizeFixtureRow(row) : null;
    setCachedFixture(externalFixtureId, match);
    return match;
  } catch (error) {
    if (error instanceof ApiFootballBudgetError) {
      const stale = getCachedFixture(externalFixtureId, 0);
      if (stale !== undefined) return stale;
    }
    throw error;
  }
}

export async function fetchLiveMatch(
  externalFixtureId: number,
): Promise<LiveMatchData | null> {
  const match = await fetchApiMatch(externalFixtureId);
  if (!match) return null;
  return mapMatchRow(match);
}

export { ApiFootballBudgetError, getApiFootballQuota } from "./apiFootballCache";

/** Resolve final score when api-football.com reports the match finished (FT). */
export function resolveFinalScoreFromApiMatch(
  match: FootballDataMatch,
  kickoffMs: number,
  nowMs: number,
  minMinutesAfterKickoff: number,
): { homeScore: number; awayScore: number } | null {
  if (!isFinishedStatus(mapStatus(match.status))) return null;

  const minutesSinceKickoff = (nowMs - kickoffMs) / 60_000;
  if (minutesSinceKickoff < minMinutesAfterKickoff) return null;

  const { homeScore, awayScore } = extractScores(match);
  if (homeScore === null || awayScore === null) return null;

  return { homeScore, awayScore };
}

export async function findExternalFixtureId(
  home: string,
  away: string,
  date: string,
): Promise<number | null> {
  if (!canUseApiFootball(5)) {
    return null;
  }

  const rows = await parseFixturesResponse(
    await apiFetch(`/fixtures?date=${date}`),
  );

  for (const row of rows) {
    if (
      teamNamesMatch(row.teams.home.name, home) &&
      teamNamesMatch(row.teams.away.name, away)
    ) {
      return row.fixture.id;
    }
  }

  return null;
}

export function isFinishedStatus(status: string): boolean {
  return status === "FT" || status === "FINISHED";
}

/** True when api-football.com reports the match has kicked off or ended. */
export function isStartedOrFinishedStatus(status: string): boolean {
  return (
    isFinishedStatus(status) ||
    status === "LIVE" ||
    status === "HT" ||
    status === "1H" ||
    status === "2H" ||
    status === "ET" ||
    status === "P"
  );
}

export function hasFinalScore(data: LiveMatchData): boolean {
  return data.homeScore !== null && data.awayScore !== null;
}
