"use client";

import L from "leaflet";
import {useEffect, useMemo} from "react";
import {Circle, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap} from "react-leaflet";
import {useTranslations} from "next-intl";
import type {JourneyOverlayEvent, MapLocation} from "@/types/map";
import type {PhilosopherViewModel} from "@/types/philosopher";

function FocusSelected({philosopher}: {philosopher?: PhilosopherViewModel}) {
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
  philosopher: PhilosopherViewModel;
  selected: boolean;
  onSelect: (philosopher: PhilosopherViewModel) => void;
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

function FitJourney({events}: {events: JourneyOverlayEvent[]}) {
  const map = useMap();

  useEffect(() => {
    if (events.length === 0) return;
    const bounds = L.latLngBounds(
      events.map(({event}) => [event.latitude, event.longitude]),
    );
    if (bounds.isValid()) map.fitBounds(bounds, {padding: [70, 70], maxZoom: 7});
  }, [events, map]);

  return null;
}

function FocusJourneyEvent({item}: {item?: JourneyOverlayEvent}) {
  const map = useMap();

  useEffect(() => {
    if (item) map.flyTo([item.event.latitude, item.event.longitude], Math.max(map.getZoom(), 6));
  }, [item, map]);

  return null;
}

function FocusNearbyLocation({location, radius}: {location: MapLocation | null; radius: number}) {
  const map = useMap();

  useEffect(() => {
    if (!location) return;
    const zoom = radius <= 50 ? 8 : radius <= 100 ? 7 : radius <= 250 ? 6 : 5;
    map.flyTo([location.latitude, location.longitude], zoom);
  }, [location, map, radius]);

  return null;
}

function JourneyOverlay({
  items,
  activeIndex,
  onSelect,
}: {
  items: JourneyOverlayEvent[];
  activeIndex: number | null;
  onSelect: (index: number) => void;
}) {
  const detail = useTranslations("Detail");
  const icons = useMemo(
    () => items.map(({originalIndex}) => L.divIcon({
      className: "philosopher-marker",
      html: `<span class="journey-marker${activeIndex === originalIndex ? " journey-marker--active" : ""}" aria-hidden="true">${originalIndex + 1}</span>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    })),
    [activeIndex, items],
  );
  const positions = items.map(({event}) => [event.latitude, event.longitude] as [number, number]);

  return (
    <>
      {positions.length > 1 ? (
        <Polyline positions={positions} pathOptions={{color: "#a06d18", weight: 4, opacity: 0.8, dashArray: "7 8"}} />
      ) : null}
      {items.map(({event, originalIndex}, index) => {
        const eventKey = `event${event.kind.charAt(0).toUpperCase()}${event.kind.slice(1)}`;
        return (
          <Marker
            key={`${event.kind}-${event.placeId}-${originalIndex}`}
            position={positions[index]}
            icon={icons[index]}
            keyboard
            zIndexOffset={1500}
            title={detail("eventLabel", {event: detail(eventKey), place: event.placeName})}
            eventHandlers={{click: () => onSelect(originalIndex)}}
          >
            <Tooltip direction="top" offset={[0, -17]}>
              <strong>{detail(eventKey)} · {event.placeName}</strong>
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
}

export function MapCanvas({
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
        {nearbyLocation ? (
          <>
            <Circle
              center={[nearbyLocation.latitude, nearbyLocation.longitude]}
              radius={nearbyRadius * 1_000}
              pathOptions={{color: "#315b45", fillColor: "#d6a84b", fillOpacity: 0.12, weight: 2}}
            />
            <Marker
              position={[nearbyLocation.latitude, nearbyLocation.longitude]}
              icon={L.divIcon({
                className: "nearby-location-icon",
                html: '<span class="nearby-location-dot" aria-hidden="true"></span>',
                iconSize: [24, 24],
                iconAnchor: [12, 12],
              })}
              keyboard
              title={nearbyLocation.label}
              zIndexOffset={2000}
            >
              <Tooltip direction="top" offset={[0, -12]}><strong>{nearbyLocation.label}</strong></Tooltip>
            </Marker>
          </>
        ) : null}
        <JourneyOverlay items={journeyEvents} activeIndex={activeJourneyEvent} onSelect={onSelectJourneyEvent} />
        <FocusSelected philosopher={selected} />
        <FitJourney events={journeyEvents} />
        <FocusJourneyEvent item={journeyEvents.find((item) => item.originalIndex === activeJourneyEvent)} />
        <FocusNearbyLocation location={nearbyLocation} radius={nearbyRadius} />
      </MapContainer>
    </div>
  );
}
