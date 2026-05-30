import assert from "node:assert/strict";
import { getFixtureById } from "../app/data/fixtures";
import {
  tweetMatchesFixture,
  tweetMentionsTeam,
} from "./xMatchPosts";

const scotland = getFixtureById(11)!;

assert.ok(
  tweetMentionsTeam("Scotland vs Curacao — predict now", "Scotland"),
  "Scotland mention",
);
assert.ok(
  tweetMentionsTeam("Scotland vs Curacao — predict now", "Curaçao"),
  "Curacao without accent",
);
assert.ok(
  tweetMatchesFixture(
    "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland vs Curacao. Reply with your score!",
    scotland,
  ),
  "full fixture in tweet text",
);
assert.ok(
  tweetMatchesFixture(
    "Scotland vs Cura??ao\nReply below with your predicted score",
    scotland,
  ),
  "X API corrupted Curaçao spelling",
);

console.log("xMatchPosts.test.ts: ok");
