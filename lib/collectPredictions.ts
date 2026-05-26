import type { Fixture } from "../app/data/fixtures";
import { savePrediction } from "../app/lib/supabase";
import { resolveMatchTweetId } from "./resolveMatchTweet";
import { fetchReplies } from "./fetchReplies";
import { parsePrediction } from "./predictionParser";

export type CollectResult = {
  matchId: number;
  fixture: string;
  tweetId: string;
  repliesFetched: number;
  validPredictionsSaved: number;
  rejectedPredictions: number;
  skippedDuplicateAuthors: number;
};

function formatHandle(username: string): string {
  return username.startsWith("@") ? username : `@${username}`;
}

export async function collectPredictionsForFixture(
  fixture: Fixture,
): Promise<CollectResult> {
  const tweetId = await resolveMatchTweetId(fixture);
  if (!tweetId) {
    throw new Error(
      `No match post found for fixture ${fixture.id}. Post from @guessthescoreX with both team names, or set tweetId.`,
    );
  }

  const replies = await fetchReplies(tweetId);
  const seenAuthors = new Set<string>();
  let validPredictionsSaved = 0;
  let rejectedPredictions = 0;
  let skippedDuplicateAuthors = 0;

  for (const reply of replies) {
    if (seenAuthors.has(reply.authorId)) {
      skippedDuplicateAuthors += 1;
      continue;
    }

    const parsed = parsePrediction(reply.text, fixture);
    if (!parsed) {
      rejectedPredictions += 1;
      continue;
    }

    await savePrediction({
      user_id: reply.authorId,
      user_handle: formatHandle(reply.authorUsername),
      match_id: fixture.id,
      home_score: parsed.homeScore,
      away_score: parsed.awayScore,
    });

    seenAuthors.add(reply.authorId);
    validPredictionsSaved += 1;
  }

  return {
    matchId: fixture.id,
    fixture: `${fixture.home} vs ${fixture.away}`,
    tweetId,
    repliesFetched: replies.length,
    validPredictionsSaved,
    rejectedPredictions,
    skippedDuplicateAuthors,
  };
}
