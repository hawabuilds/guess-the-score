"use client";

import { DM_Mono, Figtree } from "next/font/google";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  getNextFixture,
  formatGroupLine,
  formatNextMatchBadge,
} from "../data/fixtures";
import { NAV_LOGO_SRC } from "./dashboard-assets/nav-logo";
import { TROPHY_SRC } from "./dashboard-assets/trophy";
import { sessionUserIdentity } from "../lib/auth-client";
import {
  fetchLeaderboard,
  fetchNextMatchStatus,
  handleToInitials,
  handleToUsername,
  type ApiLeaderboardPlayer,
} from "../lib/leaderboard-client";
import AppTabBar from "./AppTabBar";
import { TeamFlag } from "./MatchFlags";
import LbAvatar from "./LbAvatar";
import NavUserControl from "./NavUserControl";
import NavWalletControl from "./NavWalletControl";
import PredictionModal from "./PredictionModal";
import styles from "./Dashboard.module.css";

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

const LEADERBOARD_PREVIEW_LIMIT = 5;

function XIconSmall() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622z" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

type DashboardProps = {
  onGoToLeaderboard: () => void;
  onGoToWallet: () => void;
  onGoToClaim: () => void;
};

export default function Dashboard({
  onGoToLeaderboard,
  onGoToWallet,
  onGoToClaim,
}: DashboardProps) {
  const { data: session, status } = useSession();
  const user = sessionUserIdentity(
    status,
    session?.user?.name,
    session?.user?.image,
  );

  const nextFixture = getNextFixture();

  const [predOpen, setPredOpen] = useState(false);
  const [matchStatus, setMatchStatus] = useState<string | null>(null);
  const [leaderboardPreview, setLeaderboardPreview] = useState<ApiLeaderboardPlayer[]>(
    [],
  );
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myPoints, setMyPoints] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetchNextMatchStatus().then((status) => {
      if (!cancelled) setMatchStatus(status);
    });

    void fetchLeaderboard()
      .then((data) => {
        if (cancelled) return;
        setLeaderboardPreview(data.players.slice(0, LEADERBOARD_PREVIEW_LIMIT));

        const me = session?.user?.id
          ? data.players.find((player) => player.user_id === session.user?.id)
          : undefined;
        setMyRank(me?.rank ?? null);
        setMyPoints(me?.total_points ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setLeaderboardPreview([]);
          setMyRank(null);
          setMyPoints(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  return (
    <div
      id="s-dash"
      className={`${styles.root} ${figtree.variable} ${dmMono.variable}`}
    >
      <div className={styles.app}>
        <nav className={styles.nav}>
          <div className={styles.navBrand}>
            <div className={styles.navScore}>SCORE</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={styles.navLogoImg}
              src={NAV_LOGO_SRC}
              alt="SCORE logo"
            />
          </div>
          <div className={styles.navRight}>
            <NavUserControl />
            <NavWalletControl />
          </div>
        </nav>

        <div className={styles.body}>
          <div className={styles.dashPad}>
            <div className={styles.dashGreet}>
              Hey, <strong>{user.handle}</strong> —{" "}
              {myRank ? `You're ranked #${myRank}` : "Make your first prediction"}
            </div>

            <div className={styles.tileRow}>
              <div className={`${styles.tile} ${styles.tileHl}`}>
                <div className={styles.tileLabel}>Your Rank</div>
                <div className={`${styles.tileVal} ${styles.tileValG}`}>
                  {myRank ? `#${myRank}` : "—"}
                </div>
                <div className={styles.tileDelta}>
                  {myRank ? "Live from Supabase" : "Score a match to rank"}
                </div>
              </div>
              <div className={styles.tile}>
                <div className={styles.tileLabel}>Points</div>
                <div className={styles.tileVal}>
                  {myPoints !== null ? myPoints.toLocaleString() : "—"}
                </div>
                <div className={styles.tileSub}>5 exact · 3 outcome · 1 play</div>
              </div>
            </div>

            <button
              type="button"
              className={styles.claimBanner}
              onClick={onGoToClaim}
              aria-label="Claim rewards"
            >
              <div className={styles.cbIcon}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className={styles.cbTrophyImg}
                  src={TROPHY_SRC}
                  alt="Trophy"
                />
              </div>
              <div>
                <div className={styles.cbTitle}>You have rewards to claim</div>
                <div className={styles.cbSub}>
                  0.08 BNB (≈ $48) ready to claim
                </div>
              </div>
              <div className={styles.cbChev}>
                <ChevronRight />
              </div>
            </button>

            <div className={styles.nextMatch}>
              <div className={styles.nmHead}>
                <div className={styles.nmLabel}>
                  Next Match{" "}
                  <span className={styles.nmLabelFlags}>
                    ·{" "}
                    <TeamFlag
                      team={nextFixture.home}
                      className={styles.nmFlagSmall}
                      width={18}
                      height={12}
                    />{" "}
                    vs{" "}
                    <TeamFlag
                      team={nextFixture.away}
                      className={styles.nmFlagSmall}
                      width={18}
                      height={12}
                    />
                  </span>
                </div>
                <div className={styles.nmLive}>
                  <div className={styles.nmDot} />
                  {matchStatus ?? formatNextMatchBadge(nextFixture)}
                </div>
              </div>
              <div className={styles.nmBody}>
                <div className={styles.nmTeam}>
                  <TeamFlag
                    team={nextFixture.home}
                    className={styles.nmFlagImg}
                    width={45}
                    height={30}
                  />
                  <div className={styles.nmName}>{nextFixture.home}</div>
                </div>
                <div className={styles.nmVs}>VS</div>
                <div className={styles.nmTeam}>
                  <TeamFlag
                    team={nextFixture.away}
                    className={styles.nmFlagImg}
                    width={45}
                    height={30}
                  />
                  <div className={styles.nmName}>{nextFixture.away}</div>
                </div>
              </div>
              <div className={styles.nmFoot}>
                <div className={styles.nmTime}>{formatGroupLine(nextFixture)}</div>
                <button
                  type="button"
                  className={styles.nmPredict}
                  onClick={() => setPredOpen(true)}
                >
                  Predict on
                  <XIconSmall />
                </button>
              </div>
            </div>
          </div>

          <section className={styles.lbSection}>
            <div className={styles.secHead}>
              <div className={styles.secLabel}>Leaderboard</div>
              <button
                type="button"
                className={styles.secMore}
                onClick={onGoToLeaderboard}
              >
                See all →
              </button>
            </div>
            <div className={styles.lbList}>
              {leaderboardPreview.length === 0 ? (
                <div className={styles.lbRow}>
                  <div className={styles.lbHandle}>
                    Rankings fill in after the first scored match.
                  </div>
                </div>
              ) : (
                leaderboardPreview.map((row) => {
                  const isMe =
                    Boolean(session?.user?.id) && row.user_id === session?.user?.id;
                  const username = handleToUsername(row.user_handle);

                  return (
                    <div
                      key={row.user_id}
                      className={`${styles.lbRow} ${row.rank <= 3 ? styles.lbRowT1 : ""} ${isMe ? styles.lbRowMe : ""}`}
                    >
                      <div
                        className={`${styles.lbPos} ${row.rank <= 3 ? styles.lbPosTop : ""} ${isMe ? styles.lbPosMe : ""}`}
                      >
                        {row.rank}
                      </div>
                      <LbAvatar
                        username={username}
                        initials={handleToInitials(row.user_handle)}
                        imageSrc={isMe ? user.image : undefined}
                        me={isMe}
                      />
                      <div
                        className={`${styles.lbHandle} ${isMe ? styles.lbHandleMe : ""}`}
                      >
                        {row.user_handle}
                        {isMe ? " · you" : ""}
                      </div>
                      <div
                        className={`${styles.lbPts} ${isMe ? styles.lbPtsMe : ""}`}
                      >
                        {row.total_points.toLocaleString()}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <AppTabBar
          activeTab="home"
          onHome={() => {}}
          onRanks={onGoToLeaderboard}
          onWallet={onGoToWallet}
          onClaim={onGoToClaim}
        />

        <PredictionModal
          open={predOpen}
          fixture={nextFixture}
          onClose={() => setPredOpen(false)}
        />

      </div>
    </div>
  );
}
