"use client";

import L from "leaflet";
import {useEffect, useMemo} from "react";
import {MapContainer, Marker, TileLayer, Tooltip, useMap} from "react-leaflet";
import {useTranslations} from "next-intl";
import type {Philosopher} from "@/types/philosopher";

function FocusSelected({philosopher}: {philosopher?: Philosopher}) {
  const map = useMap();

  useEffect(() => {
    if (philosopher) {
      map.flyTo([philosopher.latitude, philosopher.longitude], Math.max(map.getZoom(), 5), {duration: 0.65});
    }
  }, [map, philosopher]);

  return null;
}

function PhilosopherMarker({
  philosopher,
  selected,
  onSelect,
}: {
  philosopher: Philosopher;
  selected: boolean;
  onSelect: (philosopher: Philosopher) => void;
}) {
  const t = useTranslations("Atlas");
  const icon = useMemo(
    () =>
      L.divIcon({
        className: "philosopher-marker",
        html: `<span class="philosopher-marker__dot${selected ? " philosopher-marker__dot--active" : ""}" aria-hidden="true">${philosopher.name.charAt(0)}</span>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      }),
    [philosopher.name, selected],
  );

  return (
    <Marker
      position={[philosopher.latitude, philosopher.longitude]}
      icon={icon}
      keyboard
      title={t("openDetails", {name: philosopher.name})}
      alt={t("openDetails", {name: philosopher.name})}
      zIndexOffset={selected ? 1000 : 0}
      eventHandlers={{click: () => onSelect(philosopher)}}
    >
      <Tooltip direction="top" offset={[0, -19]} opacity={0.95}>
        <strong>{philosopher.name}</strong>
      </Tooltip>
    </Marker>
  );
}

export function MapCanvas({
  philosophers,
  selectedId,
  onSelect,
}: {
  philosophers: Philosopher[];
  selectedId: string | null;
  onSelect: (philosopher: Philosopher) => void;
}) {
  const t = useTranslations("Atlas");
  const selected = philosophers.find((philosopher) => philosopher.id === selectedId);

  return (
    <div className="h-full w-full" role="region" aria-label={t("mapLabel")}>
      <MapContainer center={[31, 20]} zoom={2.5} minZoom={2} maxZoom={9} zoomControl worldCopyJump className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />
        {philosophers.map((philosopher) => (
          <PhilosopherMarker key={philosopher.id} philosopher={philosopher} selected={philosopher.id === selectedId} onSelect={onSelect} />
        ))}
        <FocusSelected philosopher={selected} />
      </MapContainer>
    </div>
  );
}
