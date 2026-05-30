import assert from "node:assert/strict";
import { payoutAmountWei, rankPayoutBps } from "./payoutTiers";

const pot = 1_000_000_000_000_000_000n;

assert.equal(rankPayoutBps(1), 1000);
assert.equal(rankPayoutBps(5), 1000);
assert.equal(rankPayoutBps(6), 500);
assert.equal(rankPayoutBps(10), 500);
assert.equal(rankPayoutBps(11), 250);
assert.equal(rankPayoutBps(20), 250);
assert.equal(rankPayoutBps(21), null);

assert.equal(payoutAmountWei(pot, 1), 100_000_000_000_000_000n);
assert.equal(payoutAmountWei(pot, 6), 50_000_000_000_000_000n);
assert.equal(payoutAmountWei(pot, 11), 25_000_000_000_000_000n);

const total = Array.from({ length: 20 }, (_, i) =>
  payoutAmountWei(pot, i + 1)!,
).reduce((a, b) => a + b, 0n);
assert.equal(total, pot);

console.log("payoutTiers.test.ts: ok");
