# Guess the Score

The first version of my football score-prediction game — a web app where you sign in with X, connect a wallet, predict match scorelines, and climb a daily leaderboard for on-chain BNB payouts. (Copa Mundial is the follow-up rebuild of this idea.)

## How it works

- Sign in with X and connect a wallet (MetaMask via RainbowKit).
- Predict scorelines for upcoming fixtures before kickoff.
- Scoring: 5 points for an exact score, 3 for the correct result, 1 for taking part.
- The daily leaderboard decides payouts; top-20 finishers claim BNB on-chain.

## Stack

- Next.js (App Router) + TypeScript
- Supabase (Postgres) for users, predictions, and standings
- NextAuth with the X provider for sign-in
- wagmi + RainbowKit on the client; payouts settle in native BNB through a `ScorePayout` contract on BNB Smart Chain using signed claim vouchers (the prize pool is funded in part by $SCORE token taxes)
- Vercel, with cron routes for kickoff collection and match scoring

## Smart contract

The payout contract lives at [`contracts/ScorePayout.sol`](contracts/ScorePayout.sol). It holds the BNB prize pool and pays winners against off-chain **signed vouchers**: the server signs `(contract, chainId, epochId, to, amount, voucherId)`, and `claim()` recovers the signer and releases funds. Each voucher is single-use (replay-protected), epochs are capped by `totalReserved` so claims can never exceed funds held, and claims are `nonReentrant`.

## The parts that took the most work

- Making MetaMask claims reliable, and restoring the celebration/share card when users return to the app from the wallet.
- Finding the right match post on X and collecting the first valid reply per user.
- Capping each payout epoch by on-chain reserves so the claimable total can't exceed the contract balance.

## Running locally

```bash
npm install
npm run dev
```

Copy the example env file to `.env.local` and add your own keys (X auth, Supabase, RPC, and the signer/operator keys). No secrets are committed.
