"use client";

import { useTranslations } from "next-intl";
import type { AppLocale } from "@/i18n/config";
import { useLanguage } from "./LanguageProvider";
import styles from "./LanguageToggle.module.css";

type LanguageToggleProps = {
  variant?: "header" | "menu";
};

export default function LanguageToggle({ variant = "header" }: LanguageToggleProps) {
  const { locale, setLocale } = useLanguage();
  const t = useTranslations("languageToggle");

  const setActive = (next: AppLocale) => {
    if (next !== locale) {
      setLocale(next);
    }
  };

  const barClass =
    variant === "menu"
      ? `${styles.bar} ${styles.barMenu}`
      : `${styles.bar} ${styles.barHeader}`;

  return (
    <div
      className={barClass}
      role="group"
      aria-label={t("label")}
    >
      <button
        type="button"
        className={`${styles.btn}${locale === "en" ? ` ${styles.btnActive}` : ""}`}
        onClick={() => setActive("en")}
        aria-pressed={locale === "en"}
      >
        {t("en")}
      </button>
      <span className={styles.sep} aria-hidden>
        |
      </span>
      <button
        type="button"
        className={`${styles.btn}${locale === "zh" ? ` ${styles.btnActive}` : ""}`}
        onClick={() => setActive("zh")}
        aria-pressed={locale === "zh"}
      >
        {t("zh")}
      </button>
    </div>
  );
}
