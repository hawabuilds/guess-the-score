export type LiveMatchData = {
  externalFixtureId: number;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  elapsed: number | null;
};

const API_BASE = "https://api.football-data.org/v4";

/** football-data.org token from https://www.football-data.org/client/register */
function getApiKey(): string | null {
  return (
    process.env.FOOTBALL_DATA_API_KEY?.trim() ||
    process.env.FOOTBALL_DATA_TOKEN?.trim() ||
    process.env.API_FOOTBALL_KEY?.trim() ||
    null
  );
}

export function isApiFootballConfigured(): boolean {
  return Boolean(getApiKey());
}

export function isFootballDataConfigured(): boolean {
  return isApiFootballConfigured();
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
    "bosnia herzegovina": ["bosnia", "bih"],
    "cape verde": ["cabo verde"],
    "saint etienne": ["st etienne", "st. etienne", "asse", "saint-etienne"],
    nice: ["ogc nice"],
  };

  for (const [key, values] of Object.entries(aliases)) {
    const names = [key, ...values];
    const aHit = names.some((n) => a.includes(n) || n.includes(a));
    const bHit = names.some((n) => b.includes(n) || n.includes(b));
    if (aHit && bHit) return true;
  }

  return false;
}

type FootballDataScore = {
  fullTime?: { home: number | null; away: number | null };
  halfTime?: { home: number | null; away: number | null };
};

type FootballDataMatch = {
  id: number;
  status: string;
  minute?: number | null;
  homeTeam: { name: string };
  awayTeam: { name: string };
  score?: FootballDataScore;
};

type FootballDataMatchesResponse = {
  matches?: FootballDataMatch[];
};

async function apiFetch(path: string): Promise<Response> {
  const key = getApiKey();
  if (!key) {
    throw new Error("FOOTBALL_DATA_API_KEY is not configured");
  }

  return fetch(`${API_BASE}${path}`, {
    headers: {
      "X-Auth-Token": key,
    },
    next: { revalidate: 0 },
  });
}

function extractScores(match: FootballDataMatch): {
  homeScore: number | null;
  awayScore: number | null;
} {
  const fullTime = match.score?.fullTime;
  if (fullTime?.home != null && fullTime?.away != null) {
    return { homeScore: fullTime.home, awayScore: fullTime.away };
  }

  const halfTime = match.score?.halfTime;
  if (halfTime?.home != null && halfTime?.away != null) {
    return { homeScore: halfTime.home, awayScore: halfTime.away };
  }

  return { homeScore: null, awayScore: null };
}

/** Map football-data.org statuses to the short labels used in the UI. */
function mapStatus(status: string): string {
  switch (status) {
    case "FINISHED":
      return "FT";
    case "PAUSED":
      return "HT";
    case "IN_PLAY":
      return "LIVE";
    case "SCHEDULED":
    case "TIMED":
      return "NS";
    default:
      return status;
  }
}

function mapMatchRow(match: FootballDataMatch): LiveMatchData {
  const { homeScore, awayScore } = extractScores(match);

  return {
    externalFixtureId: match.id,
    status: mapStatus(match.status),
    homeScore,
    awayScore,
    elapsed: match.minute ?? null,
  };
}

export async function fetchLiveMatch(
  externalFixtureId: number,
): Promise<LiveMatchData | null> {
  const response = await apiFetch(`/matches/${externalFixtureId}`);

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`football-data.org error: ${response.status}`);
  }

  const match = (await response.json()) as FootballDataMatch;
  return mapMatchRow(match);
}

export async function findExternalFixtureId(
  home: string,
  away: string,
  date: string,
): Promise<number | null> {
  const response = await apiFetch(
    `/matches?dateFrom=${date}&dateTo=${date}`,
  );

  if (!response.ok) {
    throw new Error(`football-data.org error: ${response.status}`);
  }

  const body = (await response.json()) as FootballDataMatchesResponse;
  const rows = body.matches ?? [];

  for (const row of rows) {
    if (
      teamNamesMatch(row.homeTeam.name, home) &&
      teamNamesMatch(row.awayTeam.name, away)
    ) {
      return row.id;
    }
  }

  return null;
}

export function isFinishedStatus(status: string): boolean {
  return status === "FT" || status === "FINISHED";
}

export function hasFinalScore(data: LiveMatchData): boolean {
  return data.homeScore !== null && data.awayScore !== null;
}
