"use client";

import {useTranslations} from "next-intl";
import {useMemo, useState} from "react";
import {AtlasHeader} from "./atlas-header";
import {EmptyState} from "./empty-state";
import {MapStage} from "./map-stage";
import {NearbyExplorer} from "./nearby-explorer";
import {PhilosopherPanel} from "./philosopher-panel";
import {Timeline} from "./timeline";
import type {MapLocation} from "@/types/map";
import type {LifeEventKind, PhilosopherViewModel} from "@/types/philosopher";

const DEFAULT_YEAR = -350;
const ALL_EVENT_KINDS: LifeEventKind[] = ["birth", "education", "residence", "work", "death"];

export function AtlasClient({philosophers}: {philosophers: PhilosopherViewModel[]}) {
  const header = useTranslations("Header");
  const minYear = philosophers.length > 0 ? Math.min(...philosophers.map((item) => item.birthYear)) : -600;
  const maxYear = philosophers.length > 0 ? Math.max(...philosophers.map((item) => item.deathYear)) : 2000;
  const [year, setYear] = useState(Math.min(maxYear, Math.max(minYear, DEFAULT_YEAR)));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [journeyEnabled, setJourneyEnabled] = useState(false);
  const [journeyKinds, setJourneyKinds] = useState<LifeEventKind[]>(ALL_EVENT_KINDS);
  const [activeJourneyEvent, setActiveJourneyEvent] = useState<number | null>(null);
  const [nearbyLocation, setNearbyLocation] = useState<MapLocation | null>(null);
  const [nearbyRadius, setNearbyRadius] = useState(100);

  const visiblePhilosophers = useMemo(
    () => philosophers.filter((item) => item.birthYear <= year && item.deathYear >= year),
    [philosophers, year],
  );
  const selected = visiblePhilosophers.find((item) => item.id === selectedId) ?? null;
  const journeyEvents = useMemo(
    () => selected && journeyEnabled
      ? selected.lifeEvents.flatMap((event, originalIndex) =>
          journeyKinds.includes(event.kind) ? [{event, originalIndex}] : [],
        )
      : [],
    [journeyEnabled, journeyKinds, selected],
  );

  function resetJourney() {
    setJourneyEnabled(false);
    setJourneyKinds(ALL_EVENT_KINDS);
    setActiveJourneyEvent(null);
  }

  function selectPhilosopher(id: PhilosopherViewModel["id"]) {
    const philosopher = philosophers.find((item) => item.id === id);
    if (!philosopher) return;
    setYear(philosopher.birthYear);
    setSelectedId(id);
    resetJourney();
  }

  function selectFromMap(philosopher: PhilosopherViewModel) {
    setSelectedId(philosopher.id);
    resetJourney();
  }

  function toggleJourneyKind(kind: LifeEventKind) {
    setJourneyKinds((current) => {
      const next = current.includes(kind)
        ? current.filter((item) => item !== kind)
        : [...current, kind];
      if (activeJourneyEvent !== null && selected?.lifeEvents[activeJourneyEvent]?.kind === kind) {
        setActiveJourneyEvent(null);
      }
      return next;
    });
  }

  function changeYear(nextYear: number) {
    setYear(nextYear);
    if (selectedId) {
      const remainsVisible = philosophers.some(
        (item) => item.id === selectedId && item.birthYear <= nextYear && item.deathYear >= nextYear,
      );
      if (!remainsVisible) {
        setSelectedId(null);
        resetJourney();
      }
    }
  }

  return (
    <main className="relative h-screen min-h-[520px] w-full overflow-hidden bg-[#dbe6de] supports-[height:100dvh]:h-[100dvh]">
      <h1 className="sr-only">{header("brand")}</h1>
      <AtlasHeader />
      <NearbyExplorer
        philosophers={philosophers}
        location={nearbyLocation}
        radius={nearbyRadius}
        onLocationChange={setNearbyLocation}
        onRadiusChange={setNearbyRadius}
        onSelectPhilosopher={selectPhilosopher}
      />
      <MapStage
        philosophers={visiblePhilosophers}
        selectedId={selectedId}
        onSelect={selectFromMap}
        journeyEvents={journeyEvents}
        activeJourneyEvent={activeJourneyEvent}
        onSelectJourneyEvent={setActiveJourneyEvent}
        nearbyLocation={nearbyLocation}
        nearbyRadius={nearbyRadius}
      />
      {visiblePhilosophers.length === 0 ? <EmptyState /> : null}
      {selected ? (
        <PhilosopherPanel
          key={selected.id}
          philosopher={selected}
          onClose={() => {
            setSelectedId(null);
            resetJourney();
          }}
          onSelectPhilosopher={selectPhilosopher}
          journeyEnabled={journeyEnabled}
          enabledJourneyKinds={journeyKinds}
          activeJourneyEvent={activeJourneyEvent}
          onToggleJourney={() => {
            setJourneyEnabled((current) => !current);
            setActiveJourneyEvent(null);
          }}
          onToggleJourneyKind={toggleJourneyKind}
          onSelectJourneyEvent={(index) => {
            const kind = selected.lifeEvents[index]?.kind;
            if (kind && !journeyKinds.includes(kind)) {
              setJourneyKinds((current) => [...current, kind]);
            }
            setJourneyEnabled(true);
            setActiveJourneyEvent(index);
          }}
        />
      ) : null}
      <Timeline year={year} min={minYear} max={maxYear} count={visiblePhilosophers.length} onChange={changeYear} />
    </main>
  );
}
