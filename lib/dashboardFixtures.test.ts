import assert from "node:assert/strict";
import {
  FIXTURES,
  fixtureKickoffKey,
  getNextKickoffSlotFixtures,
  getUpcomingFixtures,
  getUpcomingFixturesOnDate,
} from "../app/data/fixtures";

const may29 = FIXTURES.filter((f) => f.date === "2026-05-29");

const beforeIran = new Date("2026-05-29T15:00:00Z");
const upcoming = getUpcomingFixtures(may29, beforeIran);

assert.equal(upcoming.length, 4);
assert.equal(getNextKickoffSlotFixtures(upcoming).length, 1);
assert.equal(getNextKickoffSlotFixtures(upcoming)[0]?.home, "Iran");

const afterIran = new Date("2026-05-29T15:31:00Z");
const midDay = getUpcomingFixtures(may29, afterIran);
assert.equal(getNextKickoffSlotFixtures(midDay).length, 2);
assert.equal(
  new Set(getNextKickoffSlotFixtures(midDay).map(fixtureKickoffKey)).size,
  1,
);

assert.equal(getUpcomingFixturesOnDate(midDay, "2026-05-29").length, 3);
assert.ok(
  may29.find((f) => f.id === 9)?.cancelled,
  "Lebanon vs Sudan should be cancelled",
);

console.log("dashboardFixtures.test.ts: ok");
