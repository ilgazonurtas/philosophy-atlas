"use client";

import {useLocale, useTranslations} from "next-intl";
import type {AppLocale} from "@/i18n/routing";
import {formatYear} from "@/lib/format-year";

interface TimelineProps {
  year: number;
  min: number;
  max: number;
  count: number;
  onChange: (year: number) => void;
}

export function Timeline({year, min, max, count, onChange}: TimelineProps) {
  const locale = useLocale() as AppLocale;
  const timeline = useTranslations("Timeline");
  const atlas = useTranslations("Atlas");
  const localizedYear = (value: number) =>
    formatYear(value, locale, (era, values) => timeline(era, values));
  const yearLabel = localizedYear(year);

  return (
    <section
      className="absolute inset-x-3 bottom-3 z-[900] rounded-2xl border border-white/40 bg-parchment/95 px-4 py-3 shadow-panel backdrop-blur-md sm:inset-x-6 sm:bottom-6 sm:px-6 sm:py-4 lg:left-1/2 lg:right-auto lg:w-[min(720px,calc(100%-3rem))] lg:-translate-x-1/2"
      aria-labelledby="timeline-title"
    >
      <div className="mb-2 flex items-end justify-between gap-4">
        <div>
          <h2 id="timeline-title" className="text-xs font-bold uppercase tracking-[0.18em] text-moss">{timeline("title")}</h2>
          <p className="mt-1 text-xs text-ink/65" aria-live="polite">{atlas("visibleCount", {count, year: yearLabel})}</p>
        </div>
        <output htmlFor="atlas-year" className="shrink-0 font-serif text-2xl font-bold text-ink sm:text-3xl">
          {yearLabel}
        </output>
      </div>
      <label htmlFor="atlas-year" className="sr-only">{timeline("year")}</label>
      <input
        id="atlas-year"
        className="timeline-range block h-7 w-full cursor-pointer"
        type="range"
        min={min}
        max={max}
        step={1}
        value={year}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-ink/45" aria-hidden="true">
        <span>{localizedYear(min)}</span>
        <span>{localizedYear(max)}</span>
      </div>
    </section>
  );
}
