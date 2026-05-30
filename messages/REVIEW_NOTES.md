# Translation review notes (Simplified Chinese)

All values in `messages/zh.json` should be reviewed by a **native, crypto-literate translator** before launch (see key list below).

## Keys with money / financial meaning

These keys mention BNB, wallets, prizes, payouts, predictions, leaderboard, rank, or equivalent financial/game-economy concepts:

### `metadata`
- `metadata.description` — mentions winning BNB

### `common`
- `common.bnb` — BNB ticker
- `common.rank` — rank label
- `common.rankHash` — rank with number (leaderboard placement)
- `common.pointsShort` — points abbreviation (scoring / payout tiers)
- `common.pointsLabel` — points label (leaderboard scoring)
- `common.approxUsd` — USD equivalent of crypto amount
- `common.approxUsdInline` — inline USD approximation
- `common.rewardDays` — count of reward days (payout)
- `common.claimAll` — bulk claim action (payout)
- `common.claimedOn` — claim confirmation date (payout)
- `common.rankMeta` — rank + tier + points on claim cards (payout context)
- `common.playersCount` — leaderboard player count copy

### `landing`
- `landing.subtitle` — win real money, leaderboard
- `landing.statPrizePool` — prize pool label
- `landing.statPrizePoolValue` — prize pool amount ($1,400)
- `landing.statPayout` — payout label
- `landing.statPayoutValue` — payout frequency (Daily)

### `dashboard`
- `dashboard.greetingRanked` — leaderboard rank
- `dashboard.greetingFirstPrediction` — first prediction (game / scoring)
- `dashboard.yourRank` — user rank
- `dashboard.scoreToRank` — rank via scoring
- `dashboard.pointsScoring` — points rules (exact / outcome / play)
- `dashboard.claimRewardsAria` — claim rewards (payout)
- `dashboard.rewardsToClaim` — rewards available (payout)
- `dashboard.rewardsReady` — BNB amount ready to claim (payout)
- `dashboard.predictOnX` — prediction action
- `dashboard.leaderboard` — leaderboard section title
- `dashboard.leaderboardEmpty` — leaderboard empty state

### `leaderboard`
- `leaderboard.navTitle` — rankings navigation
- `leaderboard.title` — leaderboard title
- `leaderboard.loadingRankings` — loading rankings
- `leaderboard.loadFailed` — rankings load error
- `leaderboard.emptyState` — unscored predictions / points

### `tiers`
- `tiers.tier1Name` — payout tier name
- `tiers.tier1Range` — top ranks (payout band)
- `tiers.tier2Name` — payout tier name
- `tiers.tier2Range` — rank range (payout band)
- `tiers.tier3Name` — payout tier name
- `tiers.tier3Range` — rank range (payout band)

### `wallet`
- `wallet.navTitle` — wallet screen
- `wallet.connectedTitle` — wallet connected
- `wallet.connectTitle` — connect wallet
- `wallet.connectedSub` — prize winnings paid in BNB
- `wallet.connectSub` — winnings destination, BNB prizes, play without wallet
- `wallet.networkBsc` — BNB Smart Chain
- `wallet.networkWrong` — wrong network (BSC)
- `wallet.walletBalance` — wallet balance
- `wallet.disconnect` — disconnect wallet
- `wallet.connectWallet` — connect wallet CTA
- `wallet.skipForNow` — defer wallet connection

### `claim`
- `claim.navTitle` — claim reward
- `claim.emptyTitle` — no rewards
- `claim.emptySub` — top 20 / claimable rewards
- `claim.makePrediction` — prediction CTA
- `claim.totalReady` — total ready to claim (payout)
- `claim.readyToClaim` — ready to claim section
- `claim.claimHistory` — claim history
- `claim.claim` — claim button (payout)
- `claim.toastClaimed` — reward claimed confirmation
- `claim.toastOpeningX` — share after claim

### `predictionModal`
- `predictionModal.ariaLabel` — predict on X
- `predictionModal.title` — predict on X
- `predictionModal.replyUnder` — reply with score prediction
- `predictionModal.replyOnX` — submit prediction on X

### `celebrationCard`
- `celebrationCard.prizeWon` — prize won label
- `celebrationCard.tagline` — predict & win daily
- `celebrationCard.tweetWon` — share text with winnings + leaderboard
- `celebrationCard.tweetWonFallback` — share text with real money + leaderboard
- `celebrationCard.tweetAmount` — BNB + USD amount in tweet

### `tabBar`
- `tabBar.ranks` — leaderboard tab
- `tabBar.wallet` — wallet tab
- `tabBar.claim` — claim / payout tab

### `nav`
- `nav.walletAccount` — wallet account control
- `nav.connectWallet` — connect wallet control
