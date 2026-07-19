"use client";

import dynamic from "next/dynamic";
import {useTranslations} from "next-intl";
import type {JourneyOverlayEvent, MapLocation} from "@/types/map";
import type {PhilosopherViewModel} from "@/types/philosopher";

const MapCanvas = dynamic(() => import("./map-canvas").then((module) => module.MapCanvas), {
  ssr: false,
  loading: () => <MapLoading />,
});

function MapLoading() {
  const t = useTranslations("States");

  return (
    <div className="grid h-full place-items-center bg-[#dbe6de]" aria-busy="true">
      <div className="rounded-full bg-parchment px-5 py-3 text-sm font-bold text-moss shadow-lg">{t("mapLoading")}</div>
    </div>
  );
}

export function MapStage({
  philosophers,
  selectedId,
  onSelect,
  journeyEvents,
  activeJourneyEvent,
  onSelectJourneyEvent,
  nearbyLocation,
  nearbyRadius,
}: {
  philosophers: PhilosopherViewModel[];
  selectedId: string | null;
  onSelect: (philosopher: PhilosopherViewModel) => void;
  journeyEvents: JourneyOverlayEvent[];
  activeJourneyEvent: number | null;
  onSelectJourneyEvent: (index: number) => void;
  nearbyLocation: MapLocation | null;
  nearbyRadius: number;
}) {
  return (
    <MapCanvas
      philosophers={philosophers}
      selectedId={selectedId}
      onSelect={onSelect}
      journeyEvents={journeyEvents}
      activeJourneyEvent={activeJourneyEvent}
      onSelectJourneyEvent={onSelectJourneyEvent}
      nearbyLocation={nearbyLocation}
      nearbyRadius={nearbyRadius}
    />
  );
}
