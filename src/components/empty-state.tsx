"use client";

import {useTranslations} from "next-intl";

export function EmptyState() {
  const t = useTranslations("States");

  return (
    <div className="pointer-events-none absolute inset-0 z-[800] grid place-items-center px-6 pb-32" role="status">
      <div className="max-w-sm rounded-3xl border border-white/50 bg-parchment/95 p-6 text-center shadow-panel backdrop-blur-md">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-moss/10 font-serif text-2xl text-moss" aria-hidden="true">∅</span>
        <h2 className="mt-4 font-serif text-xl font-bold text-ink">{t("emptyTitle")}</h2>
        <p className="mt-2 text-sm leading-6 text-ink/65">{t("emptyBody")}</p>
      </div>
    </div>
  );
}
