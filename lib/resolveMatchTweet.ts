import type { Fixture } from "@/app/data/fixtures";
import { fixtureCacheKey } from "@/app/data/fixtures";
import {
  clearMatchTweetId,
  getMatchState,
  saveMatchTweetId,
} from "@/app/lib/supabase";
import {
  discoverMatchPost,
  tweetIsValidMatchPost,
  type DiscoveredMatchPost,
} from "@/lib/xMatchPosts";
import { fetchTweetById, getMatchPostAccount, matchPostUrl } from "@/lib/xApi";

export type ResolveMatchPostOptions = {
  /**
   * UI predict flow: trust Supabase tweet id without X lookup (0 extra calls).
   * Cron/sync can set false to validate cache before collection.
   */
  trustCachedTweet?: boolean;
  /** Search pages when discovering — keep 1 for UI, 2 for background sync. */
  discoverMaxPages?: number;
};

const DEFAULT_UI_OPTIONS: ResolveMatchPostOptions = {
  trustCachedTweet: true,
  discoverMaxPages: 1,
};

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

async function cacheTweetId(fixture: Fixture, tweetId: string): Promise<void> {
  try {
    await saveMatchTweetId(fixture.id, tweetId, fixtureCacheKey(fixture));
  } catch {
    // Caching is optional — discovery still works without Supabase.
  }
}

/** Use tweet id stored in Supabase — no X API call. */
async function readTrustedCachedPost(
  fixture: Fixture,
  account: string,
): Promise<DiscoveredMatchPost | null> {
  let state;
  try {
    state = await getMatchState(fixture.id);
  } catch {
    return null;
  }

  const storedTweetId = state?.match_tweet_id?.trim();
  if (!storedTweetId || !state) return null;

  const expectedKey = fixtureCacheKey(fixture);
  if (state.match_fixture_key && state.match_fixture_key !== expectedKey) {
    return null;
  }

  return toMatchPost(storedTweetId, account, "database");
}

/** Validates cached id via X (1 API call). Only for cron when trust is disabled. */
async function readVerifiedCachedPost(
  fixture: Fixture,
  account: string,
): Promise<DiscoveredMatchPost | null> {
  const trusted = await readTrustedCachedPost(fixture, account);
  if (!trusted) return null;

  try {
    const hit = await fetchTweetById(trusted.tweetId);
    if (!hit) return null;
    if (hit.authorUsername.toLowerCase() !== account.toLowerCase()) return null;

    if (!tweetIsValidMatchPost(hit, fixture)) return null;

    return toMatchPost(trusted.tweetId, account, "database", hit.text);
  } catch {
    return null;
  }
}

export async function resolveMatchPost(
  fixture: Fixture,
  options: ResolveMatchPostOptions = DEFAULT_UI_OPTIONS,
): Promise<DiscoveredMatchPost | null> {
  const account = getMatchPostAccount();
  const trustCached = options.trustCachedTweet ?? true;
  const discoverMaxPages = options.discoverMaxPages ?? 1;

  const manualTweetId = fixtureTweetId(fixture);
  if (manualTweetId) {
    await cacheTweetId(fixture, manualTweetId);
    return toMatchPost(manualTweetId, account, "fixture");
  }

  if (trustCached) {
    const trusted = await readTrustedCachedPost(fixture, account);
    if (trusted) return trusted;
  } else {
    const verified = await readVerifiedCachedPost(fixture, account);
    if (verified) return verified;

    try {
      await clearMatchTweetId(fixture.id);
    } catch {
      // Optional cache clear before re-discovery.
    }
  }

  const discovered = await discoverMatchPost(fixture, discoverMaxPages);
  if (discovered) {
    await cacheTweetId(fixture, discovered.tweetId);
    return discovered;
  }

  return null;
}

export async function resolveMatchTweetId(
  fixture: Fixture,
  options?: ResolveMatchPostOptions,
): Promise<string | null> {
  const post = await resolveMatchPost(fixture, options);
  return post?.tweetId ?? null;
}
