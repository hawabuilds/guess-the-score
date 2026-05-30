import en from "../messages/en.json";
import zh from "../messages/zh.json";
import type { AppLocale } from "./config";

export const messagesByLocale = {
  en,
  zh,
} as const satisfies Record<AppLocale, typeof en>;

export function getMessages(locale: AppLocale) {
  return messagesByLocale[locale];
}
