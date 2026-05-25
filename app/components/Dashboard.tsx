"use client";

import { DM_Mono, Figtree } from "next/font/google";
import { useCallback, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  getNextFixture,
  formatGroupLine,
  formatNextMatchBadge,
} from "../data/fixtures";
import { NAV_LOGO_SRC } from "./dashboard-assets/nav-logo";
import { TROPHY_SRC } from "./dashboard-assets/trophy";
import { sessionUserIdentity } from "../lib/auth-client";
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

const LEADERBOARD_PREVIEW = [
  {
    rank: 1,
    handle: "@cryptoking",
    pts: "9,210",
    av: "cryptoking",
    initials: "CK",
    top: true,
    t1: true,
  },
  {
    rank: 2,
    handle: "@nightowl",
    pts: "8,450",
    av: "nightowl",
    initials: "NO",
    top: true,
    t1: true,
  },
  {
    rank: 3,
    handle: "@degensama",
    pts: "7,100",
    av: "degensama",
    initials: "DS",
    top: true,
    t1: true,
  },
  {
    rank: 14,
    handle: "@jordanlee · you",
    pts: "3,840",
    av: "jordanlee",
    initials: "JL",
    me: true,
  },
  {
    rank: 15,
    handle: "@solflare99",
    pts: "3,710",
    av: "solflare99",
    initials: "SF",
  },
] as const;

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
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

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
              Hey, <strong>{user.handle}</strong> — Today&apos;s ranking
            </div>

            <div className={styles.tileRow}>
              <div className={`${styles.tile} ${styles.tileHl}`}>
                <div className={styles.tileLabel}>Your Rank</div>
                <div className={`${styles.tileVal} ${styles.tileValG}`}>
                  #14
                </div>
                <div className={styles.tileDelta}>↑ +3 today</div>
              </div>
              <div className={styles.tile}>
                <div className={styles.tileLabel}>Points</div>
                <div className={styles.tileVal}>3,840</div>
                <div className={styles.tileSub}>Top 5%</div>
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
                  {formatNextMatchBadge(nextFixture)}
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
              <div className={styles.tierHead}>
                <span className={`${styles.tierPill} ${styles.tier1}`}>
                  Tier 1
                </span>
                <span className={styles.tierMeta}>Top 5</span>
                <span className={styles.tierReward} />
              </div>
              {LEADERBOARD_PREVIEW.slice(0, 3).map((row) => (
                <div
                  key={row.rank}
                  className={`${styles.lbRow} ${styles.lbRowT1}`}
                >
                  <div
                    className={`${styles.lbPos} ${("top" in row && row.top) ? styles.lbPosTop : ""}`}
                  >
                    {row.rank}
                  </div>
                  <LbAvatar
                    username={row.av}
                    initials={row.initials}
                  />
                  <div className={styles.lbHandle}>{row.handle}</div>
                  <div className={styles.lbPts}>{row.pts}</div>
                </div>
              ))}
              <div className={styles.tierHead}>
                <span className={`${styles.tierPill} ${styles.tier3}`}>
                  Tier 3
                </span>
                <span className={styles.tierMeta}>
                  Ranks 11–20 · you&apos;re here
                </span>
                <span
                  className={`${styles.tierReward} ${styles.tierRewardDim}`}
                />
              </div>
              {LEADERBOARD_PREVIEW.slice(3).map((row) => (
                <div
                  key={row.rank}
                  className={`${styles.lbRow} ${"me" in row && row.me ? styles.lbRowMe : ""}`}
                >
                  <div
                    className={`${styles.lbPos} ${("top" in row && row.top) ? styles.lbPosTop : ""} ${"me" in row && row.me ? styles.lbPosMe : ""}`}
                  >
                    {row.rank}
                  </div>
                  <LbAvatar
                    username={"me" in row && row.me ? user.username : row.av}
                    initials={"me" in row && row.me ? user.initials : row.initials}
                    imageSrc={"me" in row && row.me ? user.image : undefined}
                    me={"me" in row && row.me}
                  />
                  <div
                    className={`${styles.lbHandle} ${"me" in row && row.me ? styles.lbHandleMe : ""}`}
                  >
                    {"me" in row && row.me ? `${user.handle} · you` : row.handle}
                  </div>
                  <div
                    className={`${styles.lbPts} ${"me" in row && row.me ? styles.lbPtsMe : ""}`}
                  >
                    {row.pts}
                  </div>
                </div>
              ))}
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
          onOpenX={() => showToast("Opening X…")}
        />

        <div
          className={`${styles.toast}${toast ? ` ${styles.toastShow}` : ""}`}
          role="status"
          aria-live="polite"
        >
          {toast ?? ""}
        </div>
      </div>
    </div>
  );
}
