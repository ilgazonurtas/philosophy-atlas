"use client";

import dynamic from "next/dynamic";
import {useTranslations} from "next-intl";
import type {Philosopher} from "@/types/philosopher";

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
}: {
  philosophers: Philosopher[];
  selectedId: string | null;
  onSelect: (philosopher: Philosopher) => void;
}) {
  return <MapCanvas philosophers={philosophers} selectedId={selectedId} onSelect={onSelect} />;
}
