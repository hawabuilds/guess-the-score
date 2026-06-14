"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useTranslations } from "next-intl";
import { DM_Mono, Figtree } from "next/font/google";
import { useSession } from "next-auth/react";
import {
  useAccount,
  useBalance,
  useChainId,
  useDisconnect,
} from "wagmi";
import { useLinkPayoutWallet } from "../lib/useLinkPayoutWallet";
import { formatPayoutWalletLinkError } from "../lib/formatPayoutWalletLinkError";
import { PAYOUT_CHAIN, PAYOUT_CHAIN_ID } from "../lib/payoutConfig";
import Link from "next/link";
import { LAND_LOGO_SRC } from "./landing-assets/logo";
import SocialLinks from "./SocialLinks";
import AppTabBar from "./AppTabBar";
import NavUserControl from "./NavUserControl";
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
  const t = useTranslations("wallet");
  const tc = useTranslations("common");
  const { status } = useSession();
  const { address, isConnected, isConnecting } = useAccount();
  const { linkStatus, linkError, retryLink } = useLinkPayoutWallet();
  const chainId = useChainId();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({
    address,
    chainId: PAYOUT_CHAIN_ID,
  });

  const networkLabel =
    chainId === PAYOUT_CHAIN.id
      ? t(PAYOUT_CHAIN_ID === 97 ? "networkBscTestnet" : "networkBsc")
      : t("networkWrong");

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
            {tc("back")}
          </button>
          <div className={styles.navTitle}>{t("navTitle")}</div>
          <NavUserControl />
        </nav>

        <div className={styles.body}>
          <div className={styles.walletHero}>
            <div className={styles.walletIconWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={styles.walletLogoImg}
                src={LAND_LOGO_SRC}
                alt={tc("scoreLogoAlt")}
              />
            </div>
            <h1 className={styles.walletTitle}>
              {isConnected ? t("connectedTitle") : t("connectTitle")}
            </h1>
            <p className={styles.walletSub}>
              {isConnected ? t("connectedSub") : t("connectSub")}
            </p>
            {!isConnected ? (
              <p className={styles.walletSub} style={{ marginTop: 8, fontSize: 12 }}>
                {t("connectMetaMaskHint")}
              </p>
            ) : null}
          </div>

          {isConnected && address ? (
            <div className={styles.walletConnected}>
              <div className={styles.wcCard}>
                <div className={styles.wcRow}>
                  <span className={styles.wcK}>{t("status")}</span>
                  <span className={styles.wcStatus}>
                    <span className={styles.statusDot} aria-hidden />
                    {t("connected")}
                  </span>
                </div>
                <div className={styles.wcRow}>
                  <span className={styles.wcK}>{t("network")}</span>
                  <span className={styles.wcV}>{networkLabel}</span>
                </div>
                <div className={styles.wcRow}>
                  <span className={styles.wcK}>{t("address")}</span>
                  <span className={`${styles.wcV} ${styles.wcAddr}`}>
                    {shortenAddress(address)}
                  </span>
                </div>
                <div className={styles.wcBalWrap}>
                  <div className={styles.wcBalLabel}>{t("walletBalance")}</div>
                  <div className={styles.wcBal}>
                    {bnbDisplay ?? tc("emDash")}{" "}
                    <span className={styles.wcUnit}>{tc("bnb")}</span>
                  </div>
                </div>
              </div>
              {linkStatus === "linked" ? (
                <p className={styles.linkConfirm} role="status">
                  {t("payoutWalletLinked")}
                </p>
              ) : null}
              {linkStatus === "error" ? (
                <div className={styles.linkErrorWrap} role="alert">
                  <p className={styles.linkError}>
                    {formatPayoutWalletLinkError(
                      linkError,
                      t("payoutWalletLinkFailed"),
                    )}
                  </p>
                  {status === "authenticated" ? (
                    <button
                      type="button"
                      className={styles.linkRetry}
                      onClick={() => retryLink()}
                    >
                      {t("payoutWalletRetry")}
                    </button>
                  ) : (
                    <p className={styles.linkErrorHint}>{t("signInXToLink")}</p>
                  )}
                </div>
              ) : null}
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() => disconnect()}
              >
                {t("disconnect")}
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
                {isConnecting ? tc("connecting") : t("connectWallet")}
              </button>
            </div>
          )}

          <p className={styles.disclaimerLine}>
            {t("disclaimerShort")}{" "}
            <Link href="/disclaimer" className={styles.disclaimerLink}>
              {t("disclaimerFullLink")}
            </Link>
          </p>

          <div className={styles.walletSocial}>
            <SocialLinks variant="accent" />
          </div>
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
