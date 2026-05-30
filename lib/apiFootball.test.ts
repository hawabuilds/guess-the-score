import assert from "node:assert/strict";
import {
  resolveFinalScoreFromApiMatch,
  type FootballDataMatch,
} from "./apiFootball";

const kickoffMs = new Date("2026-05-27T00:30:00Z").getTime();
const afterWindow = kickoffMs + 106 * 60_000;

const finished: FootballDataMatch = {
  id: 1535320,
  status: "FT",
  homeTeam: { name: "Flamengo" },
  awayTeam: { name: "Cusco" },
  score: {
    fullTime: { home: 3, away: 0 },
  },
};

assert.deepEqual(
  resolveFinalScoreFromApiMatch(finished, kickoffMs, afterWindow, 105),
  { homeScore: 3, awayScore: 0 },
  "FT + fullTime after window => score",
);

assert.equal(
  resolveFinalScoreFromApiMatch(finished, kickoffMs, kickoffMs + 60_000, 105),
  null,
  "before scoring window => null",
);

assert.equal(
  resolveFinalScoreFromApiMatch(
    { ...finished, status: "1H", score: { fullTime: { home: 1, away: 0 } } },
    kickoffMs,
    afterWindow,
    105,
  ),
  null,
  "live 1H => null even with goals",
);

assert.equal(
  resolveFinalScoreFromApiMatch(
    { ...finished, status: "FT", score: { fullTime: { home: null, away: null } } },
    kickoffMs,
    afterWindow,
    105,
  ),
  null,
  "FT without fullTime => null",
);

console.log("apiFootball.test.ts: ok");
