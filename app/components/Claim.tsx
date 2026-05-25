"use client";

import { DM_Mono, Figtree } from "next/font/google";
import { useCallback, useRef, useState } from "react";
import {
  bnbStr,
  INITIAL_REWARDS,
  usd,
  type Reward,
} from "../data/rewards";
import AppTabBar from "./AppTabBar";
import CelebrationCard, { type ShareCardData } from "./CelebrationCard";
import { TROPHY_SRC } from "./dashboard-assets/trophy";
import styles from "./Claim.module.css";

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

type ClaimProps = {
  onGoToDashboard: () => void;
  onGoToLeaderboard: () => void;
  onGoToWallet: () => void;
};

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function TrophyImage({ dim }: { dim?: boolean }) {
  return (
    <div className={`${styles.ccTrophy} ${dim ? styles.ccTrophyDim : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.ccTrophyImg} src={TROPHY_SRC} alt="Trophy" />
    </div>
  );
}

export default function Claim({
  onGoToDashboard,
  onGoToLeaderboard,
  onGoToWallet,
}: ClaimProps) {
  const [rewards, setRewards] = useState<Reward[]>(() =>
    INITIAL_REWARDS.map((r) => ({ ...r })),
  );
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [claimingAll, setClaimingAll] = useState(false);
  const [celebration, setCelebration] = useState<ShareCardData | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const claimable = rewards.filter((r) => !r.claimed);
  const history = rewards.filter((r) => r.claimed);
  const totalBnb = claimable.reduce((s, r) => s + r.bnb, 0);
  const isEmpty = rewards.length === 0;

  const closeCelebration = () => {
    setCelebration(null);
    showToast("Reward claimed ✓");
  };

  const claimDay = (id: string) => {
    const reward = rewards.find((x) => x.id === id);
    if (!reward || reward.claimed || claimingId || claimingAll) return;

    setClaimingId(id);
    setTimeout(() => {
      setRewards((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, claimed: true, txDate: r.date } : r,
        ),
      );
      setClaimingId(null);
      setCelebration({
        tier: reward.tier,
        day: reward.day,
        date: reward.date,
        bnb: reward.bnb,
      });
    }, 1400);
  };

  const claimAll = () => {
    const pending = rewards.filter((r) => !r.claimed);
    if (!pending.length || claimingAll || claimingId) return;

    const bestTier = pending.map((r) => r.tier).sort()[0]!;
    const total = pending.reduce((s, r) => s + r.bnb, 0);

    setClaimingAll(true);
    setTimeout(() => {
      setRewards((prev) =>
        prev.map((r) =>
          !r.claimed ? { ...r, claimed: true, txDate: r.date } : r,
        ),
      );
      setClaimingAll(false);
      setCelebration({
        tier: bestTier,
        day: `${pending.length} days`,
        date: "",
        bnb: total,
        multi: pending.length,
      });
    }, 1500);
  };

  return (
    <div
      id="s-claim"
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
          <div className={styles.navTitle}>Claim Reward</div>
          <div className={styles.navSpacer} aria-hidden />
        </nav>

        <div className={styles.claimPre}>
          <div className={styles.body}>
            {isEmpty ? (
              <div className={styles.claimEmpty}>
                <div className={styles.ceTitle}>No rewards yet</div>
                <p className={styles.ceSub}>
                  Finish a day in the top 20 to win. Your claimable rewards will
                  appear here.
                </p>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnGreen} ${styles.emptyBtn}`}
                  onClick={onGoToDashboard}
                >
                  Make a prediction
                </button>
              </div>
            ) : (
              <>
                {claimable.length > 0 && (
                  <div className={styles.claimSummary}>
                    <div className={styles.csLbl}>Total ready to claim</div>
                    <div className={styles.csAmount}>
                      {bnbStr(totalBnb)}{" "}
                      <span className={styles.csUnit}>BNB</span>
                    </div>
                    <div className={styles.csUsd}>
                      ≈ {usd(totalBnb)} USD
                      {claimable.length > 1
                        ? ` · ${claimable.length} reward days`
                        : ""}
                    </div>
                    {claimable.length > 1 && (
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnGreen} ${styles.csClaimAll}`}
                        onClick={claimAll}
                        disabled={claimingAll || claimingId !== null}
                      >
                        {claimingAll
                          ? "Sending…"
                          : `Claim all (${claimable.length})`}
                      </button>
                    )}
                  </div>
                )}

                {claimable.length > 0 && (
                  <>
                    <div className={styles.claimSecHead}>
                      <span>Ready to claim</span>
                      <span className={styles.cshCount}>{claimable.length}</span>
                    </div>
                    <div className={styles.claimList}>
                      {claimable.map((r) => (
                        <div key={r.id} className={styles.claimCard}>
                          <TrophyImage />
                          <div className={styles.ccMid}>
                            <div className={styles.ccDay}>
                              {r.day} · {r.date}
                            </div>
                            <div className={styles.ccMeta}>
                              Rank #{r.rank} · {r.tier} ·{" "}
                              {r.pts.toLocaleString()} pts
                            </div>
                          </div>
                          <div className={styles.ccRight}>
                            <div className={styles.ccAmt}>
                              {bnbStr(r.bnb)}{" "}
                              <span className={styles.ccUnit}>BNB</span>
                            </div>
                            <div className={styles.ccUsd}>≈ {usd(r.bnb)}</div>
                            <button
                              type="button"
                              className={styles.ccBtn}
                              onClick={() => claimDay(r.id)}
                              disabled={
                                claimingId === r.id ||
                                claimingAll ||
                                (claimingId !== null && claimingId !== r.id)
                              }
                            >
                              {claimingId === r.id ? "Sending…" : "Claim"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {history.length > 0 && (
                  <>
                    <div className={styles.claimSecHead}>
                      <span>Claim history</span>
                    </div>
                    <div className={styles.claimList}>
                      {history.map((r) => (
                        <div
                          key={r.id}
                          className={`${styles.claimCard} ${styles.claimCardClaimed}`}
                        >
                          <TrophyImage dim />
                          <div className={styles.ccMid}>
                            <div className={styles.ccDay}>
                              {r.day} · {r.date}
                            </div>
                            <div className={styles.ccMeta}>
                              Rank #{r.rank} · {r.tier} ·{" "}
                              {r.pts.toLocaleString()} pts
                            </div>
                          </div>
                          <div className={styles.ccRight}>
                            <div className={styles.ccAmt}>
                              {bnbStr(r.bnb)}{" "}
                              <span className={styles.ccUnit}>BNB</span>
                            </div>
                            <div className={styles.ccUsd}>≈ {usd(r.bnb)}</div>
                            <div className={styles.ccStatus}>
                              <CheckIcon />
                              Claimed {r.txDate}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <AppTabBar
          activeTab="claim"
          onHome={onGoToDashboard}
          onRanks={onGoToLeaderboard}
          onWallet={onGoToWallet}
          onClaim={() => {}}
        />

        <div
          className={`${styles.toast}${toast ? ` ${styles.toastShow}` : ""}`}
          role="status"
          aria-live="polite"
        >
          {toast ?? ""}
        </div>

        <CelebrationCard
          open={celebration !== null}
          data={celebration}
          onClose={closeCelebration}
          onShareFallback={() => showToast("Opening X…")}
        />
      </div>
    </div>
  );
}
