"use client";

import {useTranslations} from "next-intl";

export default function ErrorPage({reset}: {error: Error & {digest?: string}; reset: () => void}) {
  const t = useTranslations("States");

  return (
    <main className="grid min-h-screen place-items-center bg-parchment px-6">
      <section className="max-w-md text-center" aria-labelledby="error-title">
        <p className="mb-3 text-4xl" aria-hidden="true">◎</p>
        <h1 id="error-title" className="font-serif text-3xl font-bold text-ink">{t("errorTitle")}</h1>
        <p className="mt-3 text-ink/70">{t("errorBody")}</p>
        <button className="mt-6 rounded-full bg-moss px-6 py-3 font-semibold text-white" onClick={reset}>
          {t("retry")}
        </button>
      </section>
    </main>
  );
}
