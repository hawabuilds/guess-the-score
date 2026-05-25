"use client";

import { DM_Mono, Figtree } from "next/font/google";
import { Fragment } from "react";
import { useSession } from "next-auth/react";
import {
  avatarInitials,
  LB_PLAYERS,
  LB_TIERS,
  tierForRank,
  type LeaderboardPlayer,
  type LeaderboardTier,
} from "../data/leaderboard";
import { sessionUserIdentity } from "../lib/auth-client";
import AppTabBar from "./AppTabBar";
import LbAvatar from "./LbAvatar";
import styles from "./Leaderboard.module.css";

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-figtree",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
});

type LeaderboardProps = {
  onGoToDashboard: () => void;
  onGoToWallet: () => void;
  onGoToClaim: () => void;
};

function TierHeader({ tier }: { tier: LeaderboardTier }) {
  const pillClass =
    tier.pillClass === "tier1"
      ? styles.tier1
      : tier.pillClass === "tier2"
        ? styles.tier2
        : styles.tier3;

  return (
    <div className={styles.tierHead}>
      <span className={`${styles.tierPill} ${pillClass}`}>{tier.name}</span>
      <span className={styles.tierMeta}>{tier.range}</span>
      <span
        className={`${styles.tierReward}${tier.dimReward ? ` ${styles.tierRewardDim}` : ""}`}
      />
    </div>
  );
}

function LeaderboardRow({
  player,
  tier,
  userHandle,
  userInitials,
  userAv,
  userImage,
}: {
  player: LeaderboardPlayer;
  tier: LeaderboardTier | undefined;
  userHandle: string;
  userInitials: string;
  userAv: string;
  userImage?: string;
}) {
  const rowTierClass =
    tier?.rowClass === "t1"
      ? styles.lbRowT1
      : tier?.rowClass === "t2"
        ? styles.lbRowT2
        : "";

  return (
    <div
      className={`${styles.lbRow} ${rowTierClass} ${player.me ? styles.lbRowMe : ""}`}
    >
      <div
        className={`${styles.lbPos} ${player.r <= 3 ? styles.lbPosTop : ""} ${player.me ? styles.lbPosMe : ""}`}
      >
        {player.r}
      </div>
      <LbAvatar
        username={player.me ? userAv : player.av}
        initials={player.me ? userInitials : avatarInitials(player.av)}
        imageSrc={player.me ? userImage : undefined}
        me={player.me}
      />
      <div className={`${styles.lbHandle} ${player.me ? styles.lbHandleMe : ""}`}>
        {player.me ? userHandle : player.h}
        {player.me ? " · you" : ""}
      </div>
      <div className={`${styles.lbPts} ${player.me ? styles.lbPtsMe : ""}`}>
        {player.pts.toLocaleString()}
      </div>
    </div>
  );
}

function FullLeaderboardList({
  userHandle,
  userInitials,
  userAv,
  userImage,
}: {
  userHandle: string;
  userInitials: string;
  userAv: string;
  userImage?: string;
}) {
  let lastTier: LeaderboardTier | null = null;

  return (
    <div className={styles.lbList}>
      {LB_PLAYERS.map((player) => {
        const tier = tierForRank(player.r);
        const showHeader = tier && tier !== lastTier;

        if (tier) {
          lastTier = tier;
        }

        return (
          <Fragment key={player.r}>
            {showHeader && tier ? <TierHeader tier={tier} /> : null}
            <LeaderboardRow
              player={player}
              tier={tier}
              userHandle={userHandle}
              userInitials={userInitials}
              userAv={userAv}
              userImage={userImage}
            />
          </Fragment>
        );
      })}
    </div>
  );
}

export default function Leaderboard({
  onGoToDashboard,
  onGoToWallet,
  onGoToClaim,
}: LeaderboardProps) {
  const { data: session, status } = useSession();
  const user = sessionUserIdentity(
    status,
    session?.user?.name,
    session?.user?.image,
  );

  return (
    <div
      id="s-lb"
      className={`${styles.root} ${figtree.variable} ${dmMono.variable}`}
    >
      <div className={styles.app}>
        <nav className={styles.nav}>
          <button
            type="button"
            className={styles.navBack}
            onClick={onGoToDashboard}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
          <div className={styles.navTitle}>Rankings</div>
          <div className={styles.navSpacer} aria-hidden />
        </nav>

        <div className={styles.body}>
          <div className={styles.lbHero}>
            <h1 className={styles.lbTitle}>Today · Leaderboard</h1>
            <p className={styles.lbSubText}>
              14,200 players · Resets daily at midnight UTC
            </p>
          </div>
          <div className={styles.lbListWrap}>
            <FullLeaderboardList
              userHandle={user.handle}
              userInitials={user.initials}
              userAv={user.username}
              userImage={user.image}
            />
          </div>
        </div>

        <AppTabBar
          activeTab="ranks"
          onHome={onGoToDashboard}
          onRanks={() => {}}
          onWallet={onGoToWallet}
          onClaim={onGoToClaim}
        />
      </div>
    </div>
  );
}
