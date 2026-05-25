"use client";

import { useState } from "react";
import { DM_Mono, Figtree } from "next/font/google";
import { hasSignedInWithXBefore, signInWithX } from "../lib/auth-client";
import {
  FIXTURES,
  formatFixtureLabel,
  formatKickoffUtc,
} from "../data/fixtures";
import { LAND_LOGO_SRC } from "./landing-assets/logo";
import { TeamFlag } from "./MatchFlags";
import SwitchXAccountModal from "./SwitchXAccountModal";
import styles from "./Landing.module.css";

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

const STATS = [
  { value: "14,200", key: "Players" },
  { value: "$1,400", key: "Prize pool" },
  { value: "Daily", key: "Payout" },
] as const;

function XLogo() {
  return (
    <svg
      className={styles.xIcon}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622z" />
    </svg>
  );
}

export default function Landing() {
  const [switchModalOpen, setSwitchModalOpen] = useState(false);

  const handleSignIn = () => {
    if (hasSignedInWithXBefore()) {
      setSwitchModalOpen(true);
      return;
    }
    void signInWithX();
  };

  return (
    <>
      <div
        id="s-landing"
        className={`${styles.root} ${figtree.variable} ${dmMono.variable}`}
      >
        <div className={styles.app}>
          <div className={styles.body}>
            <div className={styles.landHero}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={styles.landLogoImg}
                src={LAND_LOGO_SRC}
                alt="$SCORE"
              />
              <div className={styles.landNameBlock}>
                <h1 className={styles.landTitle}>Guess the score.</h1>
                <p className={styles.landSub}>
                  Predict match scores on X. Climb the leaderboard. Win real money
                  every day.
                </p>
              </div>
            </div>

            <div className={styles.landCta}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnWhite}`}
                onClick={handleSignIn}
              >
                <XLogo />
                Sign in with X
              </button>
            </div>

            <section className={styles.matchesBlock}>
              <div className={styles.blockLabel}>Upcoming Matches</div>
              <div className={styles.matchList}>
                {FIXTURES.slice(0, 3).map((fixture) => (
                  <div key={fixture.id} className={styles.matchRow}>
                    <div className={styles.matchFlagPair}>
                      <TeamFlag team={fixture.home} className={styles.flag} />
                      <TeamFlag team={fixture.away} className={styles.flag} />
                    </div>
                    <div className={styles.matchName}>
                      {formatFixtureLabel(fixture)}
                    </div>
                    <div className={styles.matchTime}>
                      {formatKickoffUtc(fixture)}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className={styles.statsStrip}>
              {STATS.map((stat) => (
                <div key={stat.key} className={styles.statBlock}>
                  <span className={styles.statVal}>{stat.value}</span>
                  <span className={styles.statKey}>{stat.key}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <SwitchXAccountModal
        open={switchModalOpen}
        onClose={() => setSwitchModalOpen(false)}
      />
    </>
  );
}
