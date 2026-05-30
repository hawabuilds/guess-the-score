"use client";

import { useTranslations } from "next-intl";
import { DM_Mono, Figtree } from "next/font/google";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  getUpcomingFixtures,
  getNextKickoffSlotFixtures,
  getUpcomingFixturesOnDate,
  formatGroupLine,
  formatNextMatchBadge,
  type Fixture,
} from "../data/fixtures";
import { NAV_LOGO_SRC } from "./dashboard-assets/nav-logo";
import { TROPHY_SRC } from "./dashboard-assets/trophy";
import { sessionUserIdentity } from "../lib/auth-client";
import {
  buildLeaderboardPreview,
  fetchLeaderboard,
  fetchMyLeaderboardStats,
  fetchUpcomingMatches,
  handleToInitials,
  handleToUsername,
  playerMatchesSession,
  type ApiLeaderboardPlayer,
  type UpcomingMatch,
} from "../lib/leaderboard-client";
import { fetchClaimableRewards } from "../lib/claimable-rewards-client";
import { bnbStr, usd } from "../data/rewards";
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

type UpcomingMatchCardProps = {
  fixture: UpcomingMatch;
  label: string;
  onPredict: () => void;
  vsLabel: string;
  predictLabel: string;
};

function UpcomingMatchCard({
  fixture,
  label,
  onPredict,
  vsLabel,
  predictLabel,
}: UpcomingMatchCardProps) {
  return (
    <div className={styles.nextMatch}>
      <div className={styles.nmHead}>
        <div className={styles.nmLabel}>{label}</div>
        <div className={styles.nmLive}>
          <div className={styles.nmDot} />
          {fixture.statusLabel ?? formatNextMatchBadge(fixture)}
        </div>
      </div>
      <div className={styles.nmBody}>
        <div className={styles.nmTeam}>
          <TeamFlag
            team={fixture.home}
            className={styles.nmFlagImg}
            width={45}
            height={30}
          />
          <div className={styles.nmName}>{fixture.home}</div>
        </div>
        <div className={styles.nmVs}>{vsLabel}</div>
        <div className={styles.nmTeam}>
          <TeamFlag
            team={fixture.away}
            className={styles.nmFlagImg}
            width={45}
            height={30}
          />
          <div className={styles.nmName}>{fixture.away}</div>
        </div>
      </div>
      <div className={styles.nmFoot}>
        <div className={styles.nmTime}>{formatGroupLine(fixture)}</div>
        <button type="button" className={styles.nmPredict} onClick={onPredict}>
          {predictLabel}
          <XIconSmall />
        </button>
      </div>
    </div>
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
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const { data: session, status } = useSession();
  const user = sessionUserIdentity(
    status,
    session?.user?.name,
    session?.user?.image,
    session?.user?.username,
  );

  const upcomingFallback = getUpcomingFixtures();
  const [upcomingFixtures, setUpcomingFixtures] =
    useState<UpcomingMatch[]>(upcomingFallback);
  const [showAllToday, setShowAllToday] = useState(false);
  const [predFixture, setPredFixture] = useState<Fixture | null>(null);
  const [leaderboardPreview, setLeaderboardPreview] = useState<ApiLeaderboardPlayer[]>(
    [],
  );
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myPoints, setMyPoints] = useState<number | null>(null);
  const [claimableBnb, setClaimableBnb] = useState(0);
  const [hasClaimableRewards, setHasClaimableRewards] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const refreshUpcomingMatches = () => {
      void fetchUpcomingMatches()
        .then((fixtures) => {
          if (cancelled) return;
          setUpcomingFixtures(fixtures);
        })
        .catch(() => {
          if (!cancelled) {
            setUpcomingFixtures(getUpcomingFixtures());
          }
        });
    };

    refreshUpcomingMatches();
    const intervalId = window.setInterval(refreshUpcomingMatches, 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;

    let cancelled = false;
    const currentSession = session;

    void fetchMyLeaderboardStats()
      .then((stats) => {
        if (cancelled) return;
        setMyRank(stats.rank);
        setMyPoints(stats.total_points);
      })
      .catch(() => {
        if (!cancelled) {
          setMyRank(null);
          setMyPoints(null);
        }
      });

    void fetchLeaderboard()
      .then((data) => {
        if (cancelled) return;
        setLeaderboardPreview(
          buildLeaderboardPreview(data.players, currentSession, LEADERBOARD_PREVIEW_LIMIT),
        );
      })
      .catch(() => {
        if (!cancelled) setLeaderboardPreview([]);
      });

    return () => {
      cancelled = true;
    };
  }, [status, session, session?.user?.id, session?.user?.name, session?.user?.username]);

  useEffect(() => {
    if (status !== "authenticated") {
      setHasClaimableRewards(false);
      setClaimableBnb(0);
      return;
    }

    let cancelled = false;

    void fetchClaimableRewards()
      .then((rewards) => {
        if (cancelled) return;
        const pending = rewards.filter((reward) => !reward.claimed);
        setHasClaimableRewards(pending.length > 0);
        setClaimableBnb(pending.reduce((sum, reward) => sum + reward.bnb, 0));
      })
      .catch(() => {
        if (!cancelled) {
          setHasClaimableRewards(false);
          setClaimableBnb(0);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [status, session?.user?.id, session?.user?.username]);

  const nextSlotFixtures = useMemo(
    () => getNextKickoffSlotFixtures(upcomingFixtures),
    [upcomingFixtures],
  );
  const primaryDay = upcomingFixtures[0]?.date;
  const todayFixtures = useMemo(
    () =>
      primaryDay
        ? getUpcomingFixturesOnDate(upcomingFixtures, primaryDay)
        : [],
    [upcomingFixtures, primaryDay],
  );
  const canExpandToday = todayFixtures.length > nextSlotFixtures.length;
  const visibleFixtures = showAllToday ? todayFixtures : nextSlotFixtures;
  const nextSlotKey = nextSlotFixtures[0]
    ? `${nextSlotFixtures[0].date}T${nextSlotFixtures[0].time}`
    : null;

  useEffect(() => {
    setShowAllToday(false);
  }, [nextSlotKey, primaryDay]);

  return (
    <div
      id="s-dash"
      className={`${styles.root} ${figtree.variable} ${dmMono.variable}`}
    >
      <div className={styles.app}>
        <nav className={styles.nav}>
          <div className={styles.navBrand}>
            <div className={styles.navScore}>{tc("scoreBrand")}</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={styles.navLogoImg}
              src={NAV_LOGO_SRC}
              alt={tc("scoreNavLogoAlt")}
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
              {t("greetingHey")} <strong>{user.handle}</strong> —{" "}
              {myRank != null
                ? t("greetingRanked", { rank: myRank })
                : t("greetingFirstPrediction")}
            </div>

            <div className={styles.tileRow}>
              <div className={`${styles.tile} ${styles.tileHl}`}>
                <div className={styles.tileLabel}>{t("yourRank")}</div>
                <div className={`${styles.tileVal} ${styles.tileValG}`}>
                  {myRank != null ? `#${myRank}` : tc("emDash")}
                </div>
                {myRank == null ? (
                  <div className={styles.tileDelta}>{t("scoreToRank")}</div>
                ) : null}
              </div>
              <div className={styles.tile}>
                <div className={styles.tileLabel}>{tc("pointsLabel")}</div>
                <div className={styles.tileVal}>
                  {myPoints != null ? myPoints.toLocaleString() : tc("emDash")}
                </div>
                <div className={styles.tileSub}>{t("pointsScoring")}</div>
              </div>
            </div>

            {hasClaimableRewards ? (
              <button
                type="button"
                className={styles.claimBanner}
                onClick={onGoToClaim}
                aria-label={t("claimRewardsAria")}
              >
                <div className={styles.cbIcon}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className={styles.cbTrophyImg}
                    src={TROPHY_SRC}
                    alt={tc("trophyAlt")}
                  />
                </div>
                <div>
                  <div className={styles.cbTitle}>{t("rewardsToClaim")}</div>
                  <div className={styles.cbSub}>
                    {t("rewardsReady", {
                      amount: bnbStr(claimableBnb),
                      usd: usd(claimableBnb),
                    })}
                  </div>
                </div>
                <div className={styles.cbChev}>
                  <ChevronRight />
                </div>
              </button>
            ) : null}

            {upcomingFixtures.length === 0 ? (
              <div className={styles.nextMatch}>
                <div className={styles.nmHead}>
                  <div className={styles.nmLabel}>{t("nextMatch")}</div>
                </div>
                <div className={styles.nmBody}>
                  <div className={styles.nmName}>{t("noUpcomingMatches")}</div>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.upcomingList}>
                  {visibleFixtures.map((fixture, index) => (
                    <UpcomingMatchCard
                      key={fixture.id}
                      fixture={fixture}
                      label={index === 0 ? t("nextMatch") : t("upcomingMatch")}
                      onPredict={() => setPredFixture(fixture)}
                      vsLabel={tc("vs")}
                      predictLabel={t("predictOnX")}
                    />
                  ))}
                </div>
                {canExpandToday ? (
                  <button
                    type="button"
                    className={styles.upcomingToggle}
                    onClick={() => setShowAllToday((open) => !open)}
                    aria-expanded={showAllToday}
                  >
                    {showAllToday
                      ? t("showFewerFixtures")
                      : t("showAllFixtures", { count: todayFixtures.length })}
                  </button>
                ) : null}
              </>
            )}
          </div>

          <section className={styles.lbSection}>
            <div className={styles.secHead}>
              <div className={styles.secLabel}>{t("leaderboard")}</div>
              <button
                type="button"
                className={styles.secMore}
                onClick={onGoToLeaderboard}
              >
                {tc("seeAll")}
              </button>
            </div>
            <div className={styles.lbList}>
              {leaderboardPreview.length === 0 ? (
                <div className={styles.lbRow}>
                  <div className={styles.lbHandle}>{t("leaderboardEmpty")}</div>
                </div>
              ) : (
                leaderboardPreview.map((row) => {
                  const isMe = playerMatchesSession(row, session);
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
                        {isMe ? tc("youSuffix") : ""}
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

        {predFixture ? (
          <PredictionModal
            open={Boolean(predFixture)}
            fixture={predFixture}
            onClose={() => setPredFixture(null)}
          />
        ) : null}

      </div>
    </div>
  );
}
