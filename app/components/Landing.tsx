"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { DM_Mono, Figtree } from "next/font/google";
import { hasSignedInWithXBefore, signInWithX } from "../lib/auth-client";
import {
  getUpcomingFixtures,
  formatFixtureLabel,
  formatKickoffUtc,
} from "../data/fixtures";
import { LAND_LOGO_SRC } from "./landing-assets/logo";
import { TeamFlag } from "./MatchFlags";
import LanguageToggle from "./LanguageToggle";
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
  const t = useTranslations("landing");
  const tc = useTranslations("common");
  const [switchModalOpen, setSwitchModalOpen] = useState(false);

  const stats = [
    { value: t("statPlayersValue"), key: t("statPlayers") },
    { value: t("statPrizePoolValue"), key: t("statPrizePool") },
    { value: t("statPayoutValue"), key: t("statPayout") },
  ] as const;

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const upcomingFixtures = getUpcomingFixtures(undefined, now);

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
          <header className={styles.landNav}>
            <LanguageToggle variant="header" />
          </header>
          <div className={styles.body}>
            <div className={styles.landHero}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={styles.landLogoImg}
                src={LAND_LOGO_SRC}
                alt={tc("scoreLogoAlt")}
              />
              <div className={styles.landNameBlock}>
                <h1 className={styles.landTitle}>{t("title")}</h1>
                <p className={styles.landSub}>{t("subtitle")}</p>
              </div>
            </div>

            <div className={styles.landCta}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnWhite}`}
                onClick={handleSignIn}
              >
                <XLogo />
                {t("signInWithX")}
              </button>
            </div>

            <section className={styles.matchesBlock}>
              <div className={styles.blockLabel}>{t("upcomingMatches")}</div>
              <div className={styles.matchList}>
                {upcomingFixtures.length === 0 ? (
                  <div className={styles.matchRow}>
                    <div className={styles.matchName}>{t("noUpcomingMatches")}</div>
                  </div>
                ) : (
                  upcomingFixtures.map((fixture) => (
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
                  ))
                )}
              </div>
            </section>

            <div className={styles.statsStrip}>
              {stats.map((stat) => (
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
