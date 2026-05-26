import type { Fixture } from "@/app/data/fixtures";
import {
  getStoredMatchTweetId,
  saveMatchTweetId,
} from "@/app/lib/supabase";
import { discoverMatchPost, type DiscoveredMatchPost } from "@/lib/xMatchPosts";
import { getMatchPostAccount, matchPostUrl } from "@/lib/xApi";

function fixtureTweetId(fixture: Fixture): string | null {
  const manualTweetId = fixture.tweetId?.trim();
  return manualTweetId || null;
}

function toMatchPost(
  tweetId: string,
  account: string,
  source: DiscoveredMatchPost["source"],
  text = "",
): DiscoveredMatchPost {
  return {
    tweetId,
    text,
    url: matchPostUrl(tweetId, account),
    account,
    source,
  };
}

async function cacheTweetId(matchId: number, tweetId: string): Promise<void> {
  try {
    await saveMatchTweetId(matchId, tweetId);
  } catch {
    // Caching is optional — discovery still works without Supabase.
  }
}

async function readCachedTweetId(matchId: number): Promise<string | null> {
  try {
    return await getStoredMatchTweetId(matchId);
  } catch {
    return null;
  }
}

export async function resolveMatchPost(
  fixture: Fixture,
): Promise<DiscoveredMatchPost | null> {
  const account = getMatchPostAccount();
  const manualTweetId = fixtureTweetId(fixture);

  if (manualTweetId) {
    return toMatchPost(manualTweetId, account, "fixture");
  }

  // Search X first so new posts show up immediately (no DB round-trip).
  const discovered = await discoverMatchPost(fixture);
  if (discovered) {
    await cacheTweetId(fixture.id, discovered.tweetId);
    return discovered;
  }

  const storedTweetId = await readCachedTweetId(fixture.id);
  if (storedTweetId) {
    return toMatchPost(storedTweetId, account, "database");
  }

  return null;
}

export async function resolveMatchTweetId(fixture: Fixture): Promise<string | null> {
  const post = await resolveMatchPost(fixture);
  return post?.tweetId ?? null;
}
