import type { Fixture } from "@/app/data/fixtures";
import { fixtureDateTime } from "@/app/data/fixtures";
import { getTeamAliases, normalizeForTeamMatch } from "@/lib/predictionParser";
import {
  getMatchPostAccount,
  matchPostUrl,
  searchRecentPosts,
  type XTweetHit,
} from "@/lib/xApi";

export type DiscoveredMatchPost = {
  tweetId: string;
  text: string;
  url: string;
  account: string;
  source: "fixture" | "database" | "search";
};

function tweetMentionsTeam(text: string, team: string): boolean {
  const lower = normalizeForTeamMatch(text);
  return getTeamAliases(team).some((alias) => lower.includes(normalizeForTeamMatch(alias)));
}

export function tweetMatchesFixture(text: string, fixture: Fixture): boolean {
  return tweetMentionsTeam(text, fixture.home) && tweetMentionsTeam(text, fixture.away);
}

function tweetIsValidMatchPost(hit: XTweetHit, fixture: Fixture): boolean {
  if (!tweetMatchesFixture(hit.text, fixture)) return false;

  const kickoffMs = fixtureDateTime(fixture).getTime();
  const postedMs = new Date(hit.createdAt).getTime();
  const hoursFromKickoff = (postedMs - kickoffMs) / (60 * 60 * 1000);

  // From 7 days before kickoff up to 2 hours after (covers late posts / index lag).
  return hoursFromKickoff >= -168 && hoursFromKickoff <= 2;
}

/** Prefer the newest valid match post from the account. */
function pickBestTweet(hits: XTweetHit[], fixture: Fixture): XTweetHit | null {
  let best: XTweetHit | null = null;

  for (const hit of hits) {
    if (!tweetIsValidMatchPost(hit, fixture)) continue;

    if (
      !best ||
      new Date(hit.createdAt).getTime() > new Date(best.createdAt).getTime()
    ) {
      best = hit;
    }
  }

  return best;
}

function searchAliasTerms(team: string): string[] {
  return getTeamAliases(team)
    .map((alias) => alias.replace(/[^\w\s-]/g, " ").trim())
    .filter((alias) => alias.length >= 3)
    .slice(0, 4);
}

function buildSearchQueries(fixture: Fixture): Array<{ query: string; pages: number }> {
  const account = getMatchPostAccount();
  const base = `-is:retweet -is:reply from:${account}`;
  const homeTerms = searchAliasTerms(fixture.home);
  const awayTerms = searchAliasTerms(fixture.away);

  const queries: Array<{ query: string; pages: number }> = [
    { query: base, pages: 2 },
  ];

  if (homeTerms.length > 0 && awayTerms.length > 0) {
    queries.push({
      query: `${base} (${homeTerms.join(" OR ")}) (${awayTerms.join(" OR ")})`,
      pages: 1,
    });
  }

  queries.push({
    query: `${base} Nice Etienne`,
    pages: 1,
  });

  return queries;
}

export async function discoverMatchPost(fixture: Fixture): Promise<DiscoveredMatchPost | null> {
  const account = getMatchPostAccount();
  const seenIds = new Set<string>();
  const hits: XTweetHit[] = [];

  for (const { query, pages } of buildSearchQueries(fixture)) {
    const pageHits = await searchRecentPosts(query, pages);
    for (const hit of pageHits) {
      if (seenIds.has(hit.id)) continue;
      seenIds.add(hit.id);
      hits.push(hit);
    }
  }

  const best = pickBestTweet(hits, fixture);
  if (!best) return null;

  return {
    tweetId: best.id,
    text: best.text,
    url: matchPostUrl(best.id, account),
    account,
    source: "search",
  };
}
