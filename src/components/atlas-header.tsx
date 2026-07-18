"use client";

import {useTranslations} from "next-intl";
import {LocaleSwitcher} from "./locale-switcher";

export function AtlasHeader() {
  const t = useTranslations("Header");

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex items-start justify-between gap-4 p-4 sm:p-6">
      <div className="pointer-events-auto rounded-2xl bg-ink/90 px-4 py-3 text-white shadow-lg backdrop-blur-md sm:px-5">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full border border-gold/70 font-serif text-xl text-gold" aria-hidden="true">Φ</span>
          <div>
            <p className="font-serif text-lg font-bold leading-none sm:text-xl">{t("brand")}</p>
            <p className="mt-1 hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60 sm:block">{t("tagline")}</p>
          </div>
        </div>
      </div>
      <div className="pointer-events-auto">
        <LocaleSwitcher />
      </div>
    </header>
  );
}
