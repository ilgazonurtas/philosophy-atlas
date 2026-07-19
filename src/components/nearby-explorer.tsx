"use client";

import {useLocale, useTranslations} from "next-intl";
import {FormEvent, useMemo, useState} from "react";
import type {AppLocale} from "@/i18n/routing";
import type {GeocodingResult, MapLocation} from "@/types/map";
import type {LifeEventViewModel, PhilosopherViewModel} from "@/types/philosopher";

const RADII = [50, 100, 250, 500] as const;

function distanceInKilometres(left: MapLocation, right: MapLocation) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = radians(right.latitude - left.latitude);
  const longitudeDelta = radians(right.longitude - left.longitude);
  const leftLatitude = radians(left.latitude);
  const rightLatitude = radians(right.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(leftLatitude) * Math.cos(rightLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return 6_371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

interface NearbyMatch {
  philosopher: PhilosopherViewModel;
  event: LifeEventViewModel;
  distance: number;
}

export function NearbyExplorer({
  philosophers,
  location,
  radius,
  onLocationChange,
  onRadiusChange,
  onSelectPhilosopher,
}: {
  philosophers: PhilosopherViewModel[];
  location: MapLocation | null;
  radius: number;
  onLocationChange: (location: MapLocation | null) => void;
  onRadiusChange: (radius: number) => void;
  onSelectPhilosopher: (id: PhilosopherViewModel["id"]) => void;
}) {
  const locale = useLocale() as AppLocale;
  const nearby = useTranslations("Nearby");
  const detail = useTranslations("Detail");
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const matches = useMemo(() => {
    if (!location) return [];
    return philosophers
      .flatMap((philosopher): NearbyMatch[] => {
        const nearest = philosopher.lifeEvents.reduce<NearbyMatch | null>((current, event) => {
          const distance = distanceInKilometres(location, {
            latitude: event.latitude,
            longitude: event.longitude,
            label: event.placeName,
          });
          return !current || distance < current.distance
            ? {philosopher, event, distance}
            : current;
        }, null);
        return nearest && nearest.distance <= radius ? [nearest] : [];
      })
      .sort((left, right) => left.distance - right.distance);
  }, [location, philosophers, radius]);

  function useMyLocation() {
    setStatus("loading");
    setSearchResults([]);
    if (!("geolocation" in navigator)) {
      setStatus("error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationChange({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          label: nearby("yourLocation"),
        });
        setStatus("idle");
      },
      () => setStatus("error"),
      {enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000},
    );
  }

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    setStatus("loading");
    setSearchResults([]);
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}&locale=${locale}`);
      if (!response.ok) throw new Error("Search failed");
      const data = (await response.json()) as {results?: unknown};
      const results = Array.isArray(data.results) ? data.results as GeocodingResult[] : [];
      setSearchResults(results);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="pointer-events-auto absolute bottom-36 left-3 z-[900] sm:bottom-40 sm:left-6" aria-labelledby="nearby-heading">
      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="rounded-full bg-parchment px-4 py-3 text-sm font-bold text-moss shadow-panel transition hover:bg-white"
        >
          {nearby("open")}
        </button>
      ) : (
        <div className="max-h-[calc(100dvh-220px)] w-[min(340px,calc(100vw-24px))] overflow-y-auto rounded-2xl bg-parchment p-4 shadow-panel">
          <div className="flex items-center justify-between gap-3">
            <h2 id="nearby-heading" className="font-serif text-xl font-bold text-ink">{nearby("title")}</h2>
            <button type="button" onClick={() => setExpanded(false)} className="grid h-9 w-9 place-items-center rounded-full bg-ink/10 text-lg" aria-label={nearby("close")}>×</button>
          </div>
          <p className="mt-1 text-xs leading-5 text-ink/60">{nearby("description")}</p>

          <button type="button" onClick={useMyLocation} className="mt-3 w-full rounded-xl bg-moss px-4 py-2.5 text-sm font-bold text-white hover:bg-ink">
            {nearby("useLocation")}
          </button>
          <form onSubmit={search} className="mt-3 flex gap-2">
            <label htmlFor="place-search" className="sr-only">{nearby("searchLabel")}</label>
            <input
              id="place-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={nearby("searchPlaceholder")}
              maxLength={120}
              className="min-w-0 flex-1 rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40"
            />
            <button type="submit" className="rounded-xl bg-gold px-3 py-2 text-sm font-bold text-ink">{nearby("search")}</button>
          </form>

          <div className="mt-2 min-h-5 text-xs text-ink/60" role="status" aria-live="polite">
            {status === "loading" ? nearby("loading") : null}
            {status === "error" ? nearby("error") : null}
          </div>

          {searchResults.length > 0 ? (
            <ul className="mt-1 space-y-1 border-b border-ink/10 pb-3">
              {searchResults.map((result) => (
                <li key={result.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onLocationChange(result);
                      setSearchResults([]);
                    }}
                    className="w-full rounded-lg px-2 py-2 text-left text-xs font-semibold leading-4 text-moss hover:bg-moss/10"
                  >
                    {result.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {location ? (
            <div className="mt-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-bold leading-5 text-ink">{location.label}</p>
                <button type="button" onClick={() => onLocationChange(null)} className="text-xs font-bold text-moss underline">{nearby("clear")}</button>
              </div>
              <label htmlFor="nearby-radius" className="mt-3 block text-xs font-bold uppercase tracking-wider text-ink/45">{nearby("radius")}</label>
              <select
                id="nearby-radius"
                value={radius}
                onChange={(event) => onRadiusChange(Number(event.target.value))}
                className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm"
              >
                {RADII.map((value) => <option key={value} value={value}>{nearby("kilometres", {count: value})}</option>)}
              </select>

              <h3 className="mt-4 text-xs font-bold uppercase tracking-wider text-ink/45">{nearby("results", {count: matches.length})}</h3>
              {matches.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {matches.map(({philosopher, event, distance}) => {
                    const eventKey = `event${event.kind.charAt(0).toUpperCase()}${event.kind.slice(1)}`;
                    return (
                      <li key={philosopher.id}>
                        <button type="button" onClick={() => onSelectPhilosopher(philosopher.id)} className="w-full rounded-xl bg-white p-3 text-left shadow-sm hover:bg-gold/15">
                          <span className="block text-sm font-bold text-ink">{philosopher.name}</span>
                          <span className="mt-1 block text-xs leading-4 text-ink/60">
                            {nearby("match", {distance: Math.round(distance), event: detail(eventKey), place: event.placeName})}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : <p className="mt-2 text-xs leading-5 text-ink/60">{nearby("empty")}</p>}
            </div>
          ) : null}

          <p className="mt-4 text-[10px] leading-4 text-ink/45">
            {nearby("privacy")} <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">© OpenStreetMap contributors</a>
          </p>
        </div>
      )}
    </section>
  );
}
