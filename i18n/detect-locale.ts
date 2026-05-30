import { type AppLocale, defaultLocale } from "./config";

/** Chinese browser language tags (language only — not region/IP). */
const CHINESE_LANGUAGE_PREFIXES = ["zh"];

function languageIndicatesChinese(language: string): boolean {
  const normalized = language.trim().toLowerCase();
  return CHINESE_LANGUAGE_PREFIXES.some(
    (prefix) =>
      normalized === prefix || normalized.startsWith(`${prefix}-`),
  );
}

/**
 * Detect preferred locale from browser language settings.
 * Uses navigator.languages / navigator.language — never geo/IP.
 */
export function detectLocaleFromBrowser(): AppLocale {
  if (typeof navigator === "undefined") {
    return defaultLocale;
  }

  const candidates = [
    ...(navigator.languages ?? []),
    navigator.language,
  ].filter(Boolean);

  for (const language of candidates) {
    if (languageIndicatesChinese(language)) {
      return "zh";
    }
  }

  return defaultLocale;
}
