"use client";

import { DM_Mono, Figtree } from "next/font/google";
import { useSession } from "next-auth/react";
import { type FormEvent, type MouseEvent, useEffect, useState } from "react";
import {
  formatExampleScore,
  formatFixtureModalSub,
  type Fixture,
} from "../data/fixtures";
import { formatHandle, signInWithX } from "../lib/auth-client";
import { savePrediction } from "../lib/supabase";
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
  onSaved: () => void;
};

function parseScore(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const score = Number.parseInt(trimmed, 10);
  if (score < 0 || score > 99) return null;
  return score;
}

export default function PredictionModal({
  open,
  fixture,
  onClose,
  onSaved,
}: PredictionModalProps) {
  const { data: session, status } = useSession();
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signedIn = status === "authenticated" && Boolean(session?.user?.id);

  useEffect(() => {
    if (!open) return;
    setHomeScore("");
    setAwayScore("");
    setSaving(false);
    setError(null);
  }, [open, fixture.id]);

  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !saving) {
      onClose();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!signedIn || !session?.user?.id) {
      setError("Sign in with X to save your prediction.");
      return;
    }

    const home = parseScore(homeScore);
    const away = parseScore(awayScore);
    if (home === null || away === null) {
      setError("Enter a valid score for both teams (0–99).");
      return;
    }

    setSaving(true);
    try {
      await savePrediction({
        user_id: session.user.id,
        user_handle: formatHandle(session.user.name),
        match_id: fixture.id,
        home_score: home,
        away_score: away,
      });
      onClose();
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save prediction.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      id="pred-modal"
      className={`${styles.modalBg} ${figtree.variable} ${dmMono.variable}${open ? ` ${styles.modalBgOpen}` : ""}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-hidden={!open}
      aria-label="Predict the score"
    >
      <div className={styles.modalSheet}>
        <div className={styles.modalHandle} />
        <div className={styles.modalTitle}>Predict the score</div>
        <div className={styles.modalSub}>{formatFixtureModalSub(fixture)}</div>

        {!signedIn && status !== "loading" ? (
          <div className={styles.modalNote}>
            Sign in with X to save your prediction for this match.
          </div>
        ) : (
          <div className={styles.modalNote}>
            Your prediction is saved here and also counts if you reply on X.
            Example:{" "}
            <strong className={styles.modalNoteExample}>
              {formatExampleScore(fixture)}
            </strong>
          </div>
        )}

        <form className={styles.scoreForm} onSubmit={handleSubmit}>
          <div className={styles.scoreRow}>
            <label className={styles.scoreField}>
              <span className={styles.scoreLabel}>{fixture.home}</span>
              <input
                className={styles.scoreInput}
                type="number"
                inputMode="numeric"
                min={0}
                max={99}
                value={homeScore}
                onChange={(event) => setHomeScore(event.target.value)}
                disabled={!signedIn || saving || status === "loading"}
                required
              />
            </label>
            <span className={styles.scoreDash}>–</span>
            <label className={styles.scoreField}>
              <span className={styles.scoreLabel}>{fixture.away}</span>
              <input
                className={styles.scoreInput}
                type="number"
                inputMode="numeric"
                min={0}
                max={99}
                value={awayScore}
                onChange={(event) => setAwayScore(event.target.value)}
                disabled={!signedIn || saving || status === "loading"}
                required
              />
            </label>
          </div>

          {error ? <div className={styles.modalError}>{error}</div> : null}

          {!signedIn && status !== "loading" ? (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnWhite}`}
              onClick={() => void signInWithX()}
            >
              Sign in with X
            </button>
          ) : (
            <button
              type="submit"
              className={`${styles.btn} ${styles.btnGreen}`}
              disabled={!signedIn || saving || status === "loading"}
            >
              {saving ? "Saving…" : "Save prediction"}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
