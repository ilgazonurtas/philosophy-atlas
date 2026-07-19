"use client";

import Image from "next/image";
import {useLocale, useTranslations} from "next-intl";
import type {AppLocale} from "@/i18n/routing";
import {formatYear} from "@/lib/format-year";
import type {InfluenceViewModel, LifeEventKind, PhilosopherViewModel} from "@/types/philosopher";

const EVENT_KINDS: LifeEventKind[] = ["birth", "education", "residence", "work", "death"];

function InfluenceList({
  heading,
  items,
  onSelect,
}: {
  heading: string;
  items: InfluenceViewModel[];
  onSelect: (id: InfluenceViewModel["id"]) => void;
}) {
  const detail = useTranslations("Detail");

  return (
    <section>
      <h3 className="text-xs font-bold uppercase tracking-wider text-ink/45">{heading}</h3>
      {items.length > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-2">
          {items.map((item) => (
            <li key={item.id}>
              {item.inAtlas ? (
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className="rounded-full bg-gold/25 px-3 py-1.5 text-xs font-bold text-ink underline decoration-gold decoration-2 underline-offset-2 transition hover:bg-gold/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss"
                  aria-label={detail("openPhilosopher", {name: item.name})}
                >
                  {item.name}
                </button>
              ) : (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block rounded-full bg-ink/5 px-3 py-1.5 text-xs font-bold text-moss underline decoration-gold decoration-2 underline-offset-2 hover:bg-ink/10"
                  aria-label={detail("openExternalPhilosopher", {name: item.name})}
                >
                  {item.name} ↗
                </a>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs leading-5 text-ink/55">{detail("noInfluences")}</p>
      )}
    </section>
  );
}

export function PhilosopherPanel({
  philosopher,
  onClose,
  onSelectPhilosopher,
  journeyEnabled,
  enabledJourneyKinds,
  activeJourneyEvent,
  onToggleJourney,
  onToggleJourneyKind,
  onSelectJourneyEvent,
}: {
  philosopher: PhilosopherViewModel;
  onClose: () => void;
  onSelectPhilosopher: (id: PhilosopherViewModel["id"]) => void;
  journeyEnabled: boolean;
  enabledJourneyKinds: LifeEventKind[];
  activeJourneyEvent: number | null;
  onToggleJourney: () => void;
  onToggleJourneyKind: (kind: LifeEventKind) => void;
  onSelectJourneyEvent: (index: number) => void;
}) {
  const locale = useLocale() as AppLocale;
  const detail = useTranslations("Detail");
  const timeline = useTranslations("Timeline");
  const year = (value: number) =>
    formatYear(value, locale, (era, values) => timeline(era, values));

  return (
    <aside
      className="absolute inset-x-3 bottom-[132px] z-[950] max-h-[calc(100dvh-220px)] overflow-y-auto rounded-3xl bg-parchment shadow-panel sm:inset-x-auto sm:bottom-32 sm:right-6 sm:top-24 sm:w-[430px] sm:max-h-none"
      aria-labelledby="philosopher-name"
    >
      <div className="relative h-36 overflow-hidden rounded-t-3xl bg-moss sm:h-44">
        <Image src={philosopher.imageUrl} alt="" fill sizes="(min-width: 640px) 430px, 100vw" className="object-cover" priority />
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
          {detail("philosopher")}
        </p>
        {philosopher.imageAttribution ? (
          <a
            href={philosopher.imageAttribution.descriptionUrl ?? philosopher.imageAttribution.originalUrl ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-4 right-4 max-w-[45%] truncate rounded-full bg-ink/70 px-3 py-1 text-[10px] text-white/80 backdrop-blur"
          >
            {detail("imageCredit", {
              artist: philosopher.imageAttribution.artist ?? detail("unknown"),
              license: philosopher.imageAttribution.license ?? detail("unknown"),
            })}
          </a>
        ) : null}
      </div>

      <div className="p-5 sm:p-6">
        <h2 id="philosopher-name" className="font-serif text-3xl font-bold leading-tight text-ink">{philosopher.name}</h2>
        <p className="mt-1 text-sm font-semibold text-moss">{year(philosopher.birthYear)} – {year(philosopher.deathYear)}</p>
        {philosopher.summary ? (
          <section className="mt-5" aria-labelledby="summary-heading">
            <h3 id="summary-heading" className="text-xs font-bold uppercase tracking-wider text-ink/45">
              {detail("summary")}
            </h3>
            <p className="mt-2 text-[15px] leading-7 text-ink/80">{philosopher.summary}</p>
          </section>
        ) : null}

        <dl className="mt-5 grid grid-cols-2 gap-4 border-y border-ink/10 py-4 text-sm">
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-ink/45">{detail("bornIn")}</dt>
            <dd className="mt-1 font-semibold text-ink">{philosopher.birthPlace}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-ink/45">{detail("lived")}</dt>
            <dd className="mt-1 font-semibold text-ink">{detail("age", {count: philosopher.deathYear - philosopher.birthYear})}</dd>
          </div>
        </dl>

        {philosopher.schoolLabels.length > 0 ? (
          <section className="mt-5" aria-labelledby="schools-heading">
            <h3 id="schools-heading" className="text-xs font-bold uppercase tracking-wider text-ink/45">{detail("school")}</h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {philosopher.schoolLabels.map((school) => (
                <li key={school} className="rounded-full bg-moss/10 px-3 py-1.5 text-xs font-semibold text-moss">{school}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-5 border-t border-ink/10 pt-5" aria-label={detail("journey")}>
          <div className="flex items-center justify-between gap-3">
            {philosopher.lifeEvents.length > 0 ? (
              <button
                type="button"
                onClick={onToggleJourney}
                className="rounded-full bg-moss px-3 py-2 text-xs font-bold text-white transition hover:bg-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                aria-pressed={journeyEnabled}
              >
                {detail(journeyEnabled ? "hideJourney" : "showJourney")}
              </button>
            ) : null}
          </div>

          {philosopher.lifeEvents.length === 0 ? (
            <p className="mt-2 text-sm text-ink/60">{detail("journeyUnavailable")}</p>
          ) : null}

          {journeyEnabled && philosopher.lifeEvents.length > 0 ? (
            <div className="mt-3 rounded-2xl border border-ink/10 bg-white p-3">
              <fieldset>
                <legend className="text-xs font-bold uppercase tracking-wider text-ink/45">
                  {detail("eventFilters")}
                </legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {EVENT_KINDS.flatMap((kind) => {
                    const count = philosopher.lifeEvents.filter((event) => event.kind === kind).length;
                    if (count === 0) return [];
                    const eventKey = `event${kind.charAt(0).toUpperCase()}${kind.slice(1)}`;
                    return [(
                      <label key={kind} className="flex cursor-pointer items-center gap-2 rounded-full bg-moss/10 px-3 py-2 text-xs font-bold text-moss">
                        <input
                          type="checkbox"
                          checked={enabledJourneyKinds.includes(kind)}
                          onChange={() => onToggleJourneyKind(kind)}
                          className="accent-moss"
                        />
                        {detail(eventKey)} ({count})
                      </label>
                    )];
                  })}
                </div>
              </fieldset>
              <p className="mt-3 border-y border-ink/10 bg-parchment/70 px-3 py-2 text-[11px] leading-4 text-ink/55">
                {detail("journeyDisclaimer")}
              </p>
              <ol className="mt-2 max-h-52 overflow-y-auto">
                {philosopher.lifeEvents.map((event, index) => {
                  const eventKey = `event${event.kind.charAt(0).toUpperCase()}${event.kind.slice(1)}`;
                  const date = event.startYear === null
                    ? detail("unknownDate")
                    : event.endYear !== null && event.endYear !== event.startYear
                      ? `${year(event.startYear)} – ${year(event.endYear)}`
                      : year(event.startYear);
                  return (
                    <li key={`${event.kind}-${event.placeId}-${index}`} className={`flex items-center rounded-xl ${activeJourneyEvent === index ? "bg-gold/25" : "hover:bg-ink/5"} ${enabledJourneyKinds.includes(event.kind) ? "" : "opacity-45"}`}>
                      <button
                        type="button"
                        onClick={() => onSelectJourneyEvent(index)}
                        className="flex min-w-0 flex-1 items-start gap-3 rounded-xl px-3 py-2 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-moss"
                      >
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-moss text-[11px] font-bold text-white">
                          {index + 1}
                        </span>
                        <span>
                          <span className="block text-sm font-bold text-ink">
                            {detail(eventKey)} · {event.placeName}
                          </span>
                          <span className="block text-xs text-ink/55">{date}</span>
                        </span>
                      </button>
                      <a
                        href={event.source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mr-2 rounded-full px-2 py-1 text-xs font-bold text-moss hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-moss"
                        aria-label={detail("openSource", {title: event.source.title})}
                      >
                        ↗
                      </a>
                    </li>
                  );
                })}
              </ol>
            </div>
          ) : null}
        </section>

        <div className="mt-5 grid grid-cols-1 gap-5 border-t border-ink/10 pt-5 sm:grid-cols-2">
          <div className="max-h-40 overflow-y-auto pr-1">
            <InfluenceList heading={detail("influencedBy")} items={philosopher.influencedBy} onSelect={onSelectPhilosopher} />
          </div>
          <div className="max-h-40 overflow-y-auto pr-1">
            <InfluenceList heading={detail("influenced")} items={philosopher.influenced} onSelect={onSelectPhilosopher} />
          </div>
        </div>

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
