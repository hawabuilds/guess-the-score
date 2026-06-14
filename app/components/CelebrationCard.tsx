"use client";

import { toBlob } from "html-to-image";
import { useTranslations } from "next-intl";
import { DM_Mono, Figtree } from "next/font/google";
import { useSession } from "next-auth/react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { bnbStr, usd } from "../data/rewards";
import { sessionUserIdentity } from "../lib/auth-client";
import { translateTierLabel } from "../lib/i18n-tiers";
import { SHARE_CARD_LOGO_SRC } from "./dashboard-assets/share-card-logo";
import { TROPHY_SRC } from "./dashboard-assets/trophy";
import { resolveShareAvatarDataUrl } from "../lib/shareCardImages";
import styles from "./CelebrationCard.module.css";
const SHARE_CARD_LOGO_HEIGHT = 45;
const SHARE_CARD_LOGO_WIDTH = 63;

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

export type ShareCardData = {
  tier: string;
  day: string;
  date: string;
  bnb: number;
  multi?: number;
};

type ConfettiPiece = {
  left: string;
  top: string;
  background: string;
  transform: string;
  opacity: string;
};

type ShareFallbackDetail = {
  imageCopied: boolean;
};

type CelebrationCardProps = {
  open: boolean;
  data: ShareCardData | null;
  onClose: () => void;
  onShareFallback?: (detail: ShareFallbackDetail) => void;
};

function XIcon() {
  return (
    <svg className={styles.xIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622z" />
    </svg>
  );
}

function generateConfetti(): ConfettiPiece[] {
  const colors = ["#0066FF", "#3388FF", "#FFFFFF", "#3B82F6"];
  return Array.from({ length: 18 }, (_, i) => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 55}%`,
    background: colors[i % colors.length]!,
    transform: `rotate(${Math.random() * 360}deg)`,
    opacity: (0.5 + Math.random() * 0.45).toFixed(2),
  }));
}

const CAPTURE_OPTS = {
  cacheBust: false,
  backgroundColor: "#0A0A0A",
  pixelRatio: 2,
  skipFonts: true,
} as const;

const IMAGE_WAIT_MS = 8000;

function waitNextFrames(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

async function waitForImageLoaded(img: HTMLImageElement): Promise<void> {
  if (!img.complete || img.naturalWidth === 0) {
    await withTimeout(
      new Promise<void>((resolve) => {
        const finish = () => resolve();
        img.addEventListener("load", finish, { once: true });
        img.addEventListener("error", finish, { once: true });
      }),
      IMAGE_WAIT_MS,
    );
  }

  if (img.complete && img.naturalWidth > 0 && typeof img.decode === "function") {
    await withTimeout(img.decode(), IMAGE_WAIT_MS);
  }
}

async function waitForCardImages(card: HTMLElement): Promise<void> {
  const imgs = [...card.querySelectorAll("img")];
  await Promise.all(imgs.map((img) => waitForImageLoaded(img)));

  const logo = card.querySelector<HTMLImageElement>("#share-logo");
  if (!logo) {
    console.warn("[share] logo element missing before capture");
    return;
  }

  if (!logo.complete || logo.naturalWidth === 0) {
    console.warn("[share] logo not ready before capture, retrying once", {
      src: logo.currentSrc || logo.src,
      complete: logo.complete,
      naturalWidth: logo.naturalWidth,
    });
    logo.src = SHARE_CARD_LOGO_SRC;
    await waitForImageLoaded(logo);
  }

  if (!logo.complete || logo.naturalWidth === 0) {
    console.warn("[share] logo failed to load before capture", {
      src: logo.currentSrc || logo.src,
      complete: logo.complete,
      naturalWidth: logo.naturalWidth,
    });
  } else {
    console.log("[share] logo ready for capture", {
      src: logo.currentSrc || logo.src,
      naturalWidth: logo.naturalWidth,
    });
  }
}

async function isBlobNonBlank(blob: Blob): Promise<boolean> {
  if (blob.size < 1500) return false;

  try {
    const bitmap = await createImageBitmap(blob);
    const sampleSize = 48;
    const canvas = document.createElement("canvas");
    canvas.width = sampleSize;
    canvas.height = sampleSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return blob.size > 8000;
    }

    ctx.drawImage(bitmap, 0, 0, sampleSize, sampleSize);
    bitmap.close();

    const { data } = ctx.getImageData(0, 0, sampleSize, sampleSize);
    let nonBgPixels = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]!;
      const g = data[i + 1]!;
      const b = data[i + 2]!;
      const a = data[i + 3]!;
      if (a < 12) continue;
      if (Math.abs(r - 10) > 18 || Math.abs(g - 10) > 18 || Math.abs(b - 10) > 18) {
        nonBgPixels++;
      }
    }
    return nonBgPixels > 24;
  } catch {
    return blob.size > 8000;
  }
}

export default function CelebrationCard({
  open,
  data,
  onClose,
  onShareFallback,
}: CelebrationCardProps) {
  const t = useTranslations("celebrationCard");
  const tc = useTranslations("common");
  const tt = useTranslations("tiers");
  const { data: session, status } = useSession();
  const user = sessionUserIdentity(
    status,
    session?.user?.name,
    session?.user?.image,
    session?.user?.username,
  );
  const profileImage = session?.user?.image ?? null;
  const cardRef = useRef<HTMLDivElement>(null);
  const avRef = useRef<HTMLDivElement>(null);
  const capturedBlobRef = useRef<Blob | null>(null);
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const avatarReadyRef = useRef<Promise<void>>(Promise.resolve());
  const [preparingCapture, setPreparingCapture] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setAvatarDataUrl(null);
      avatarReadyRef.current = Promise.resolve();
      return;
    }

    let cancelled = false;
    avatarReadyRef.current = resolveShareAvatarDataUrl(
      profileImage,
      user.username,
    ).then((dataUrl) => {
      if (!cancelled) setAvatarDataUrl(dataUrl);
    });

    return () => {
      cancelled = true;
    };
  }, [open, profileImage, user.username]);

  const confetti = useMemo(
    () => (open && data ? generateConfetti() : []),
    [open, data],
  );

  const dayLabel = data
    ? data.date
      ? tc("dayDate", { day: data.day, date: data.date })
      : data.day
    : "";

  const captureCardBlob = useCallback(async (): Promise<Blob | null> => {
    const card = cardRef.current;
    if (!card) return null;

    try {
      await waitForCardImages(card);
      await waitNextFrames();

      const blob = await toBlob(card, CAPTURE_OPTS);
      if (!blob) return null;

      const ok = await isBlobNonBlank(blob);
      return ok ? blob : null;
    } catch (err) {
      console.warn("[share] capture failed:", err);
      return null;
    }
  }, []);

  const applySuccessfulCapture = useCallback((blob: Blob) => {
    capturedBlobRef.current = blob;
  }, []);

  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      const msg = e.message || "";
      const isImg =
        e.target instanceof HTMLElement && e.target.tagName === "IMG";
      if (isImg || msg === "Script error." || msg === "") {
        e.preventDefault();
      }
    };

    const onRejection = (e: PromiseRejectionEvent) => {
      if (
        e.reason &&
        /load|fetch|cors|cross-origin|network/i.test(String(e.reason))
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener("error", onError, true);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError, true);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  useEffect(() => {
    if (!open || !data) return;

    capturedBlobRef.current = null;

    let cancelled = false;

    void (async () => {
      setPreparingCapture(true);
      try {
        await withTimeout(avatarReadyRef.current, IMAGE_WAIT_MS);
        await waitNextFrames();
        const blob = await captureCardBlob();
        if (cancelled || !blob) return;
        await applySuccessfulCapture(blob);
      } catch (err) {
        console.warn("[share] prepare failed:", err);
      } finally {
        if (!cancelled) setPreparingCapture(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, data, captureCardBlob, applySuccessfulCapture]);

  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const shareTweetText = t("shareTweetText");

  const openXIntent = () => {
    const url = new URL("https://twitter.com/intent/tweet");
    url.searchParams.set("text", shareTweetText);
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  };

  const copyImageToClipboard = async (blob: Blob): Promise<boolean> => {
    if (!navigator.clipboard?.write) return false;

    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      return true;
    } catch {
      return false;
    }
  };

  const postToX = async () => {
    setPreparingCapture(true);
    try {
      let blob = capturedBlobRef.current;
      if (!blob) {
        blob = await captureCardBlob();
        if (blob) await applySuccessfulCapture(blob);
      }

      if (blob && typeof navigator.share === "function") {
        const file = new File([blob], "guessthescore-win.png", {
          type: "image/png",
        });
        const shareData = { text: shareTweetText, files: [file] };

        try {
          if (!navigator.canShare || navigator.canShare(shareData)) {
            await navigator.share(shareData);
            return;
          }

          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ text: shareTweetText, files: [file] });
            return;
          }
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") return;
        }
      }

      const imageCopied = blob ? await copyImageToClipboard(blob) : false;
      openXIntent();
      onShareFallback?.({ imageCopied });
    } finally {
      setPreparingCapture(false);
    }
  };

  if (!open || !data || !mounted) return null;

  return createPortal(
    <div
      id="share-bg"
      className={`${styles.shareBg} ${figtree.variable} ${dmMono.variable} ${styles.shareBgOpen}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={t("ariaLabel")}
    >
      <div className={styles.shareModal}>
        <div
          ref={cardRef}
          id="share-card"
          className={styles.shareCard}
        >
          <div className={styles.shareAtmos} id="share-atmos">
            <div className={`${styles.beam} ${styles.beamL}`} />
            <div className={`${styles.beam} ${styles.beamR}`} />
            {confetti.map((piece, i) => (
              <div
                key={i}
                className={styles.confetti}
                style={{
                  left: piece.left,
                  top: piece.top,
                  background: piece.background,
                  transform: piece.transform,
                  opacity: piece.opacity,
                }}
              />
            ))}
          </div>
          <div className={styles.shareInner}>
            <div className={styles.shareHead}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                id="share-logo"
                className={styles.shareLogo}
                src={SHARE_CARD_LOGO_SRC}
                alt={tc("scoreNavLogoAlt")}
                width={SHARE_CARD_LOGO_WIDTH}
                height={SHARE_CARD_LOGO_HEIGHT}
                decoding="sync"
              />
              <div className={styles.shareBrand}>{tc("scoreBrand")}</div>
            </div>

            <div className={styles.shareHero}>
              <div className={styles.shareWon}>{t("winner")}</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={styles.shareTrophy}
                src={TROPHY_SRC}
                alt={tc("trophyAlt")}
              />
            </div>

            <div className={styles.shareUser}>
              <div ref={avRef} className={styles.shareAv} id="share-av">
                {avatarDataUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={avatarDataUrl} alt={user.initials} />
                ) : (
                  user.initials
                )}
              </div>
              <div className={styles.shareHandle}>{user.handle}</div>
            </div>

            <div className={styles.shareMeta}>
              <span className={styles.shareChip}>
                {translateTierLabel(tt, data.tier)}
              </span>
              <span className={`${styles.shareChip} ${styles.shareChipDay}`}>
                {dayLabel}
              </span>
            </div>

            <div className={styles.sharePayout}>
              <div className={styles.spLabel}>{t("prizeWon")}</div>
              <div className={styles.shareAmtBnb}>
                {bnbStr(data.bnb)}{" "}
                <span className={styles.shareAmtUnit}>{tc("bnb")}</span>
              </div>
              <div className={styles.shareAmtUsd}>
                {tc("approxUsd", { amount: usd(data.bnb) })}
              </div>
            </div>

            <div className={styles.shareTag}>{t("tagline")}</div>
          </div>
        </div>

        <div className={styles.shareActions}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnGreen}`}
            onClick={postToX}
            disabled={preparingCapture}
          >
            <XIcon />
            {preparingCapture ? t("preparingImage") : t("shareOnX")}
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={onClose}
          >
            {tc("done")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
