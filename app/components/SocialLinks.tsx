"use client";

import { useTranslations } from "next-intl";
import { SOCIAL_TELEGRAM_URL, SOCIAL_X_URL } from "../lib/socialLinks";
import { TelegramIcon, XIcon } from "./SocialIcons";
import styles from "./SocialLinks.module.css";

type SocialLinksProps = {
  className?: string;
  /** Muted icons for SiteFooter; solid green for wallet. */
  variant?: "footer" | "accent";
};

export default function SocialLinks({
  className,
  variant = "footer",
}: SocialLinksProps) {
  const tSocial = useTranslations("social");

  const variantClass =
    variant === "accent" ? styles.socialAccent : styles.socialFooter;

  return (
    <div
      className={`${styles.social} ${variantClass} ${className ?? ""}`.trim()}
    >
      <a
        href={SOCIAL_X_URL}
        className={styles.socialLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={tSocial("followXAria")}
      >
        <XIcon className={styles.socialIcon} />
      </a>
      <a
        href={SOCIAL_TELEGRAM_URL}
        className={styles.socialLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={tSocial("joinTelegramAria")}
      >
        <TelegramIcon className={styles.socialIcon} />
      </a>
    </div>
  );
}
