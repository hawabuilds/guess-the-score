import assert from "node:assert/strict";
import {
  FIXTURES,
  fixtureDateTime,
  getNextFixture,
  getUpcomingFixtures,
  isFixtureNotStarted,
} from "../app/data/fixtures";

const first = FIXTURES[0]!;

assert.equal(first.externalFixtureId, 1544803);
assert.equal(first.home, "Iran");
assert.equal(FIXTURES.length, 7);

const beforeKickoff = new Date(fixtureDateTime(first).getTime() - 60_000);
const afterKickoff = new Date(fixtureDateTime(first).getTime() + 60_000);

assert.equal(isFixtureNotStarted(first, beforeKickoff), true);
assert.equal(isFixtureNotStarted(first, afterKickoff), false);
const may30 = FIXTURES.filter((f) => f.date === "2026-05-30");
const may30Before = new Date("2026-05-30T11:00:00Z");
assert.equal(getUpcomingFixtures(may30, may30Before).length, 2);
assert.equal(getNextFixture(FIXTURES, beforeKickoff)?.id, 6);
assert.ok(FIXTURES.every((f) => f.id > 5), "active fixtures must not reuse legacy match ids");

console.log("fixtures.test.ts: ok");
