"use client";

import { Figtree } from "next/font/google";
import { type MouseEvent, useEffect, useState } from "react";
import {
  formatExampleScore,
  formatFixtureModalSub,
  type Fixture,
} from "../data/fixtures";
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
      .catch(() => setPostError("Could not load the match post. Try again in a moment."))
      .finally(() => setLoadingPost(false));
  }, [open, fixture.id]);

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
      aria-label="Predict on X"
    >
      <div className={styles.modalSheet}>
        <div className={styles.modalHandle} />
        <div className={styles.modalTitle}>Predict on X</div>
        <div className={styles.modalSub}>{formatFixtureModalSub(fixture)}</div>

        <div className={styles.modalNote}>
          Reply under {accountHandle}&apos;s match post with your score. Example:{" "}
          <strong className={styles.modalNoteExample}>
            {matchPost?.exampleReply ?? formatExampleScore(fixture)}
          </strong>
        </div>

        {loadingPost ? (
          <div className={styles.modalNote}>Finding the match post…</div>
        ) : matchPost?.found && matchPost.replyIntentUrl ? (
          <a
            className={`${styles.btn} ${styles.btnWhite}`}
            href={matchPost.replyIntentUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Reply on X
          </a>
        ) : (
          <div className={styles.modalNote}>
            {postError ??
              `No match post found yet. ${accountHandle} needs to post this fixture with both team names.`}
          </div>
        )}

        {matchPost?.postUrl ? (
          <a
            className={styles.modalLink}
            href={matchPost.postUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            View match post on X
          </a>
        ) : null}
      </div>
    </div>
  );
}
