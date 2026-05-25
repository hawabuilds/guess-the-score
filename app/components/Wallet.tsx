"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { DM_Mono, Figtree } from "next/font/google";
import { useSession } from "next-auth/react";
import { bsc } from "wagmi/chains";
import {
  useAccount,
  useBalance,
  useChainId,
  useDisconnect,
} from "wagmi";
import { signOutOfX } from "../lib/auth-client";
import { LAND_LOGO_SRC } from "./landing-assets/logo";
import AppTabBar from "./AppTabBar";
import styles from "./Wallet.module.css";

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

type WalletProps = {
  onGoToDashboard: () => void;
  onGoToLeaderboard: () => void;
  onGoToClaim: () => void;
};

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function formatBnbBalance(wei: bigint | undefined) {
  if (wei === undefined) return null;
  const whole = wei / 1_000_000_000_000_000_000n;
  const frac = (wei % 1_000_000_000_000_000_000n)
    .toString()
    .padStart(18, "0")
    .slice(0, 4);
  return `${whole.toString()}.${frac}`;
}

export default function Wallet({
  onGoToDashboard,
  onGoToLeaderboard,
  onGoToClaim,
}: WalletProps) {
  const { status } = useSession();
  const { address, isConnected, isConnecting } = useAccount();
  const chainId = useChainId();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({
    address,
    chainId: bsc.id,
  });

  const networkLabel =
    chainId === bsc.id
      ? "BNB Smart Chain"
      : "Wrong network — switch to BSC";

  const bnbDisplay = formatBnbBalance(balance?.value);

  return (
    <div
      id="s-wallet"
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
          <div className={styles.navTitle}>Wallet</div>
          <div className={styles.navSpacer} aria-hidden />
        </nav>

        <div className={styles.body}>
          <div className={styles.walletHero}>
            <div className={styles.walletIconWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={styles.walletLogoImg}
                src={LAND_LOGO_SRC}
                alt="$SCORE"
              />
            </div>
            <h1 className={styles.walletTitle}>
              {isConnected ? "Wallet connected" : "Connect your wallet"}
            </h1>
            <p className={styles.walletSub}>
              {isConnected
                ? "Your prize winnings (paid in BNB) will be sent to this wallet."
                : "This is where your winnings get sent. Prizes are paid in crypto (BNB). No wallet needed just to play."}
            </p>
          </div>

          {isConnected && address ? (
            <div className={styles.walletConnected}>
              <div className={styles.wcCard}>
                <div className={styles.wcRow}>
                  <span className={styles.wcK}>Status</span>
                  <span className={styles.wcStatus}>
                    <span className={styles.statusDot} aria-hidden />
                    Connected
                  </span>
                </div>
                <div className={styles.wcRow}>
                  <span className={styles.wcK}>Network</span>
                  <span className={styles.wcV}>{networkLabel}</span>
                </div>
                <div className={styles.wcRow}>
                  <span className={styles.wcK}>Address</span>
                  <span className={`${styles.wcV} ${styles.wcAddr}`}>
                    {shortenAddress(address)}
                  </span>
                </div>
                <div className={styles.wcBalWrap}>
                  <div className={styles.wcBalLabel}>Wallet balance</div>
                  <div className={styles.wcBal}>
                    {bnbDisplay ?? "—"}{" "}
                    <span className={styles.wcUnit}>BNB</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() => disconnect()}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className={styles.walletConnectWrap}>
              <button
                type="button"
                className={styles.connectBtn}
                onClick={() => openConnectModal?.()}
                disabled={isConnecting}
              >
                {isConnecting ? "Connecting…" : "Connect Wallet"}
              </button>
            </div>
          )}

          {status === "authenticated" ? (
            <button
              type="button"
              className={styles.btnGhost}
              onClick={() => signOutOfX()}
            >
              Sign out of X
            </button>
          ) : null}

          <button
            type="button"
            className={styles.walletSkip}
            onClick={onGoToDashboard}
          >
            Skip for now
          </button>
        </div>

        <AppTabBar
          activeTab="wallet"
          onHome={onGoToDashboard}
          onRanks={onGoToLeaderboard}
          onWallet={() => {}}
          onClaim={onGoToClaim}
        />
      </div>
    </div>
  );
}
