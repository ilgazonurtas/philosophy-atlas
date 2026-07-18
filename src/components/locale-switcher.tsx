"use client";

import {useLocale, useTranslations} from "next-intl";
import {useTransition} from "react";
import {usePathname, useRouter} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";

export function LocaleSwitcher() {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Header");
  const [isPending, startTransition] = useTransition();

  function switchLocale(nextLocale: AppLocale) {
    startTransition(() => {
      router.replace(pathname, {locale: nextLocale});
    });
  }

  return (
    <div
      className="flex rounded-full border border-white/20 bg-ink/70 p-1 text-xs font-bold text-white shadow-lg backdrop-blur-md"
      role="group"
      aria-label={t("language")}
      aria-busy={isPending}
    >
      {(["en", "tr"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => switchLocale(option)}
          aria-pressed={locale === option}
          className={`rounded-full px-3 py-2 transition ${
            locale === option ? "bg-parchment text-ink" : "text-white/75 hover:text-white"
          }`}
        >
          {option.toUpperCase()}
          <span className="sr-only"> {option === "en" ? t("english") : t("turkish")}</span>
        </button>
      ))}
    </div>
  );
}
