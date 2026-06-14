"use client";

import { Figtree } from "next/font/google";
import { useTranslations } from "next-intl";
import { type MouseEvent, useEffect, useState } from "react";
import {
  formatExampleScore,
  type Fixture,
} from "../data/fixtures";
import { FixtureKickoffModalSub } from "./FixtureKickoffDisplay";
import { fetchMatchPost, type MatchPostResponse } from "../lib/match-post-client";
import styles from "./PredictionModal.module.css";

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-figtree",
});

type PredictionModalProps = {
  open: boolean;
  fixture: Fixture;
  onClose: () => void;
};

export default function PredictionModal({
  open,
  fixture,
  onClose,
}: PredictionModalProps) {
  const t = useTranslations("predictionModal");
  const [matchPost, setMatchPost] = useState<MatchPostResponse | null>(null);
  const [loadingPost, setLoadingPost] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const accountHandle = matchPost?.account ? `@${matchPost.account}` : "@guessthescoreX";

  useEffect(() => {
    if (!open) return;

    setLoadingPost(true);
    setMatchPost(null);
    setPostError(null);

    void fetchMatchPost(fixture.id)
      .then((data) => {
        setMatchPost(data);
        if (data.error) {
          setPostError(data.error);
        } else if (!data.found) {
          setPostError(data.hint ?? null);
        }
      })
      .catch(() => setPostError(t("loadError")))
      .finally(() => setLoadingPost(false));
  }, [open, fixture.id, t]);

  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      id="pred-modal"
      className={`${styles.modalBg} ${figtree.variable}${open ? ` ${styles.modalBgOpen}` : ""}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-hidden={!open}
      aria-label={t("ariaLabel")}
    >
      <div className={styles.modalSheet}>
        <div className={styles.modalHandle} />
        <div className={styles.modalTitle}>{t("title")}</div>
        <div className={styles.modalSub}>
          <FixtureKickoffModalSub fixture={fixture} />
        </div>

        <div className={styles.modalNote}>
          {t("replyUnder", { account: accountHandle })}{" "}
          <strong className={styles.modalNoteExample}>
            {matchPost?.exampleReply ?? formatExampleScore(fixture)}
          </strong>
        </div>

        {loadingPost ? (
          <div className={styles.modalNote}>{t("findingPost")}</div>
        ) : matchPost?.found && matchPost.replyIntentUrl ? (
          <a
            className={`${styles.btn} ${styles.btnWhite}`}
            href={matchPost.replyIntentUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("replyOnX")}
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={styles.btnXIcon}>
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622z" />
            </svg>
          </a>
        ) : (
          <div className={styles.modalNote}>
            {postError ?? t("noMatchPost", { account: accountHandle })}
          </div>
        )}

        {matchPost?.postUrl ? (
          <a
            className={styles.modalLink}
            href={matchPost.postUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("viewPostOnX")}
          </a>
        ) : null}
      </div>
    </div>
  );
}
