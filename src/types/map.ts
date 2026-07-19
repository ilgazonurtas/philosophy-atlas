import type {LifeEventViewModel} from "./philosopher";

export interface MapLocation {
  latitude: number;
  longitude: number;
  label: string;
}

export interface GeocodingResult extends MapLocation {
  id: string;
}

export interface JourneyOverlayEvent {
  event: LifeEventViewModel;
  originalIndex: number;
}
