import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

import { AppShell } from "@/components/layout/app-shell";
import { getTheme } from "@/lib/theme.server";

import type { Locale } from "@/types";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const theme = await getTheme();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable} h-full antialiased ${theme === "dark" ? "dark" : ""}`}
    >
      <body className="bg-background text-foreground h-full">
        <NextIntlClientProvider messages={messages}>
          <AppShell theme={theme} locale={locale as Locale}>
            {children}
          </AppShell>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
