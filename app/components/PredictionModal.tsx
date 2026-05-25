"use client";

import { DM_Mono, Figtree } from "next/font/google";
import { type MouseEvent } from "react";
import {
  formatExampleScore,
  formatFixtureModalSub,
  type Fixture,
} from "../data/fixtures";
import styles from "./PredictionModal.module.css";

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

type PredictionModalProps = {
  open: boolean;
  fixture: Fixture;
  onClose: () => void;
  onOpenX: () => void;
};

function XIcon() {
  return (
    <svg className={styles.xIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622z" />
    </svg>
  );
}

export default function PredictionModal({
  open,
  fixture,
  onClose,
  onOpenX,
}: PredictionModalProps) {
  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleOpenX = () => {
    // TODO: submit prediction to backend
    onClose();
    onOpenX();
  };

  return (
    <div
      id="pred-modal"
      className={`${styles.modalBg} ${figtree.variable} ${dmMono.variable}${open ? ` ${styles.modalBgOpen}` : ""}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-hidden={!open}
      aria-label="How to predict"
    >
      <div className={styles.modalSheet}>
        <div className={styles.modalHandle} />
        <div className={styles.modalTitle}>How to predict</div>
        <div className={styles.modalSub}>{formatFixtureModalSub(fixture)}</div>
        <div className={styles.modalNote}>
          Reply to the{" "}
          <strong className={styles.modalNoteStrong}>@GuessTheScore</strong> match
          post on X with your score.
          <br />
          <br />
          Example:{" "}
          <strong className={styles.modalNoteExample}>
            {formatExampleScore(fixture)}
          </strong>
        </div>
        <button type="button" className={`${styles.btn} ${styles.btnWhite}`} onClick={handleOpenX}>
          <XIcon />
          Open X to predict
        </button>
      </div>
    </div>
  );
}
