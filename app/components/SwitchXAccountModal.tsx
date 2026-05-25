"use client";

import { DM_Mono, Figtree } from "next/font/google";
import {
  openXAccountSwitch,
  signInWithX,
  signInWithXAfterSwitch,
} from "../lib/auth-client";
import styles from "./SwitchXAccountModal.module.css";

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

type SwitchXAccountModalProps = {
  open: boolean;
  onClose: () => void;
  signedIn?: boolean;
};

export default function SwitchXAccountModal({
  open,
  onClose,
  signedIn = false,
}: SwitchXAccountModalProps) {
  if (!open) return null;

  const handleContinue = () => {
    onClose();
    if (signedIn) {
      void signInWithXAfterSwitch();
      return;
    }
    void signInWithX();
  };

  return (
    <div
      className={`${styles.modalBg} ${figtree.variable} ${dmMono.variable} ${styles.modalBgOpen}`}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={styles.modalSheet}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="switch-x-title"
      >
        <div className={styles.modalHandle} />
        <h2 id="switch-x-title" className={styles.modalTitle}>
          Switch X account
        </h2>
        <p className={styles.modalBody}>
          X keeps you logged in across tabs. To use a different account, open X
          and switch accounts there first, then come back.
        </p>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnGhost}`}
          onClick={openXAccountSwitch}
        >
          Open X to switch accounts
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={handleContinue}
        >
          Continue — Sign in with X
        </button>
        <button type="button" className={styles.btnCancel} onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
