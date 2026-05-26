"use client";

import { DM_Mono, Figtree } from "next/font/google";
import { Fragment, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  avatarInitials,
  LB_TIERS,
  tierForRank,
  type LeaderboardTier,
} from "../data/leaderboard";
import { sessionUserIdentity } from "../lib/auth-client";
import {
  fetchLeaderboard,
  handleToInitials,
  handleToUsername,
  type ApiLeaderboardPlayer,
} from "../lib/leaderboard-client";
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
  isMe,
  userImage,
}: {
  player: ApiLeaderboardPlayer;
  tier: LeaderboardTier | undefined;
  isMe: boolean;
  userImage?: string;
}) {
  const username = handleToUsername(player.user_handle);
  const rowTierClass =
    tier?.rowClass === "t1"
      ? styles.lbRowT1
      : tier?.rowClass === "t2"
        ? styles.lbRowT2
        : "";

  return (
    <div
      className={`${styles.lbRow} ${rowTierClass} ${isMe ? styles.lbRowMe : ""}`}
    >
      <div
        className={`${styles.lbPos} ${player.rank <= 3 ? styles.lbPosTop : ""} ${isMe ? styles.lbPosMe : ""}`}
      >
        {player.rank}
      </div>
      <LbAvatar
        username={username}
        initials={isMe ? handleToInitials(player.user_handle) : avatarInitials(username)}
        imageSrc={isMe ? userImage : undefined}
        me={isMe}
      />
      <div className={`${styles.lbHandle} ${isMe ? styles.lbHandleMe : ""}`}>
        {player.user_handle}
        {isMe ? " · you" : ""}
      </div>
      <div className={`${styles.lbPts} ${isMe ? styles.lbPtsMe : ""}`}>
        {player.total_points.toLocaleString()}
      </div>
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
  const [players, setPlayers] = useState<ApiLeaderboardPlayer[]>([]);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetchLeaderboard()
      .then((data) => {
        if (cancelled) return;
        setPlayers(data.players);
        setTotalPlayers(data.totalPlayers);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load rankings");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  let lastTier: LeaderboardTier | null = null;

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
            <h1 className={styles.lbTitle}>Leaderboard</h1>
            <p className={styles.lbSubText}>
              {loading
                ? "Loading rankings…"
                : `${totalPlayers.toLocaleString()} players · Points update after each match`}
            </p>
          </div>
          <div className={styles.lbListWrap}>
            {error ? (
              <p className={styles.lbSubText}>{error}</p>
            ) : loading ? (
              <p className={styles.lbSubText}>Loading…</p>
            ) : players.length === 0 ? (
              <p className={styles.lbSubText}>
                No scored predictions yet. Points appear here after the first match is scored.
              </p>
            ) : (
              <div className={styles.lbList}>
                {players.map((player) => {
                  const tier = tierForRank(player.rank);
                  const showHeader = tier && tier !== lastTier;
                  const isMe =
                    Boolean(session?.user?.id) && player.user_id === session?.user?.id;

                  if (tier) {
                    lastTier = tier;
                  }

                  return (
                    <Fragment key={player.user_id}>
                      {showHeader && tier ? <TierHeader tier={tier} /> : null}
                      <LeaderboardRow
                        player={player}
                        tier={tier}
                        isMe={isMe}
                        userImage={isMe ? user.image : undefined}
                      />
                    </Fragment>
                  );
                })}
              </div>
            )}
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
