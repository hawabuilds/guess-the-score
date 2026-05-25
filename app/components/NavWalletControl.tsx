"use client";

import { useAccountModal, useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import styles from "./Dashboard.module.css";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export default function NavWalletControl() {
  const { address, isConnected, isConnecting } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();

  if (isConnected && address) {
    return (
      <button
        type="button"
        className={styles.walletAccountPill}
        onClick={() => openAccountModal?.()}
        aria-label="Wallet account"
      >
        <span className={styles.cbadgeDot} aria-hidden />
        <span className={styles.walletAddress}>
          {shortenAddress(address)}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={styles.walletConnectBtn}
      onClick={() => openConnectModal?.()}
      disabled={isConnecting}
      aria-label="Connect wallet"
    >
      {isConnecting ? "Connecting…" : "Connect Wallet"}
    </button>
  );
}
