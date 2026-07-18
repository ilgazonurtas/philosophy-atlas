"use client";

import Image from "next/image";
import {useLocale, useTranslations} from "next-intl";
import type {AppLocale} from "@/i18n/routing";
import {formatYear} from "@/lib/format-year";
import type {Philosopher} from "@/types/philosopher";

export function PhilosopherPanel({philosopher, onClose}: {philosopher: Philosopher; onClose: () => void}) {
  const locale = useLocale() as AppLocale;
  const detail = useTranslations("Detail");
  const timeline = useTranslations("Timeline");
  const year = (value: number) =>
    formatYear(value, locale, (era, values) => timeline(era, values));

  return (
    <aside
      className="absolute inset-x-3 bottom-[132px] z-[950] max-h-[calc(100dvh-220px)] overflow-y-auto rounded-3xl bg-parchment shadow-panel sm:inset-x-auto sm:bottom-32 sm:right-6 sm:top-24 sm:w-[390px] sm:max-h-none"
      aria-labelledby="philosopher-name"
    >
      <div className="relative h-36 overflow-hidden rounded-t-3xl bg-moss sm:h-44">
        <Image src={philosopher.imageUrl} alt="" fill sizes="(min-width: 640px) 390px, 100vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/65 via-transparent to-transparent" />
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-ink/75 text-xl text-white backdrop-blur transition hover:bg-ink"
          aria-label={detail("close")}
        >
          ×
        </button>
        <p className="absolute bottom-4 left-5 rounded-full bg-gold px-3 py-1 text-xs font-bold uppercase tracking-wider text-ink">
          {philosopher.school[locale]}
        </p>
      </div>

      <div className="p-5 sm:p-6">
        <h2 id="philosopher-name" className="font-serif text-3xl font-bold leading-tight text-ink">{philosopher.name}</h2>
        <p className="mt-1 text-sm font-semibold text-moss">{year(philosopher.birthYear)} – {year(philosopher.deathYear)}</p>
        <p className="mt-4 text-[15px] leading-7 text-ink/80">{philosopher.summary[locale]}</p>

        <dl className="mt-5 grid grid-cols-2 gap-4 border-y border-ink/10 py-4 text-sm">
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-ink/45">{detail("bornIn")}</dt>
            <dd className="mt-1 font-semibold text-ink">{philosopher.birthPlace[locale]}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-ink/45">{detail("lived")}</dt>
            <dd className="mt-1 font-semibold text-ink">{detail("age", {count: philosopher.deathYear - philosopher.birthYear})}</dd>
          </div>
        </dl>

        <section className="mt-5" aria-labelledby="influences-heading">
          <h3 id="influences-heading" className="text-xs font-bold uppercase tracking-wider text-ink/45">{detail("influencedBy")}</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {philosopher.influencedBy.map((name) => <li key={name} className="rounded-full bg-moss/10 px-3 py-1.5 text-xs font-semibold text-moss">{name}</li>)}
          </ul>
        </section>

        <section className="mt-5" aria-labelledby="sources-heading">
          <h3 id="sources-heading" className="text-xs font-bold uppercase tracking-wider text-ink/45">{detail("sources")}</h3>
          <ul className="mt-2 space-y-2">
            {philosopher.sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-moss underline decoration-gold decoration-2 underline-offset-4 hover:text-ink" aria-label={detail("openSource", {title: source.title})}>
                  {source.title} ↗
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </aside>
  );
}
