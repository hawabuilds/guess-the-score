"use client";

import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { getMessages } from "@/i18n/messages";
import {
  DocumentLocaleSync,
  LanguageProvider,
  useLanguage,
} from "./LanguageProvider";

function IntlBridge({ children }: { children: ReactNode }) {
  const { locale } = useLanguage();

  return (
    <NextIntlClientProvider locale={locale} messages={getMessages(locale)}>
      <DocumentLocaleSync />
      {children}
    </NextIntlClientProvider>
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <IntlBridge>{children}</IntlBridge>
    </LanguageProvider>
  );
}
