"use client";

import styles from "./AppTabBar.module.css";

export type AppTab = "home" | "ranks" | "wallet" | "claim";

type AppTabBarProps = {
  activeTab: AppTab;
  onHome: () => void;
  onRanks: () => void;
  onWallet?: () => void;
  onClaim?: () => void;
};

function TabHomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function TabRanksIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function TabWalletIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <rect x="1" y="4" width="22" height="16" rx="2" />
      <path d="M16 10h2" />
    </svg>
  );
}

function TabClaimIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <path d="M20 12V22H4V12" />
      <path d="M22 7H2v5h20V7z" />
      <path d="M12 22V7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}

export default function AppTabBar({
  activeTab,
  onHome,
  onRanks,
  onWallet,
  onClaim,
}: AppTabBarProps) {
  const tabClass = (tab: AppTab) =>
    `${styles.tab}${activeTab === tab ? ` ${styles.tabActive}` : ""}`;

  return (
    <div className={styles.tabbar}>
      <button type="button" className={tabClass("home")} onClick={onHome}>
        <TabHomeIcon />
        Home
        <div className={styles.tabPip} />
      </button>
      <button type="button" className={tabClass("ranks")} onClick={onRanks}>
        <TabRanksIcon />
        Ranks
        <div className={styles.tabPip} />
      </button>
      <button
        type="button"
        className={tabClass("wallet")}
        onClick={onWallet}
        disabled={!onWallet}
      >
        <TabWalletIcon />
        Wallet
        <div className={styles.tabPip} />
      </button>
      <button
        type="button"
        className={tabClass("claim")}
        onClick={onClaim}
        disabled={!onClaim}
      >
        <TabClaimIcon />
        Claim
        <div className={styles.tabPip} />
      </button>
    </div>
  );
}
