"use client";

import {useMemo, useState} from "react";
import {AtlasHeader} from "./atlas-header";
import {EmptyState} from "./empty-state";
import {MapStage} from "./map-stage";
import {PhilosopherPanel} from "./philosopher-panel";
import {Timeline} from "./timeline";
import type {Philosopher} from "@/types/philosopher";

const DEFAULT_YEAR = -350;

export function AtlasClient({philosophers}: {philosophers: Philosopher[]}) {
  const minYear = philosophers.length > 0 ? Math.min(...philosophers.map((item) => item.birthYear)) : -600;
  const maxYear = philosophers.length > 0 ? Math.max(...philosophers.map((item) => item.deathYear)) : 2000;
  const [year, setYear] = useState(Math.min(maxYear, Math.max(minYear, DEFAULT_YEAR)));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visiblePhilosophers = useMemo(
    () => philosophers.filter((item) => item.birthYear <= year && item.deathYear >= year),
    [philosophers, year],
  );
  const selected = visiblePhilosophers.find((item) => item.id === selectedId) ?? null;

  function changeYear(nextYear: number) {
    setYear(nextYear);
    if (selectedId) {
      const remainsVisible = philosophers.some(
        (item) => item.id === selectedId && item.birthYear <= nextYear && item.deathYear >= nextYear,
      );
      if (!remainsVisible) setSelectedId(null);
    }
  }

  return (
    <main className="relative h-screen min-h-[520px] w-full overflow-hidden bg-[#dbe6de] supports-[height:100dvh]:h-[100dvh]">
      <h1 className="sr-only">Philo Atlas</h1>
      <AtlasHeader />
      <MapStage philosophers={visiblePhilosophers} selectedId={selectedId} onSelect={(item) => setSelectedId(item.id)} />
      {visiblePhilosophers.length === 0 ? <EmptyState /> : null}
      {selected ? <PhilosopherPanel philosopher={selected} onClose={() => setSelectedId(null)} /> : null}
      <Timeline year={year} min={minYear} max={maxYear} count={visiblePhilosophers.length} onChange={changeYear} />
    </main>
  );
}
