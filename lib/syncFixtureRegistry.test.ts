import assert from "node:assert/strict";
import { FIXTURES, fixtureCacheKey } from "../app/data/fixtures";

const ids = FIXTURES.map((f) => f.id);
const keys = FIXTURES.map((f) => fixtureCacheKey(f));

assert.equal(new Set(ids).size, ids.length, "fixture ids must be unique");
assert.equal(new Set(keys).size, keys.length, "fixture cache keys must be unique");
assert.ok(FIXTURES.length >= 7, "expected slates for 2026-05-29 and 2026-05-30");
assert.ok(
  FIXTURES.every((f) => f.id > 5),
  "must not reuse match ids 1–5 (prior days in Supabase)",
);
const may30 = FIXTURES.filter((f) => f.date === "2026-05-30");
assert.deepEqual(
  may30.map((f) => f.id).sort(),
  [11, 12],
);
assert.equal(may30.find((f) => f.id === 12)?.home, "Paris Saint Germain");
assert.equal(may30.find((f) => f.id === 12)?.away, "Arsenal");

console.log("syncFixtureRegistry.test.ts: ok");
