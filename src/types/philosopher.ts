import type {AppLocale} from "@/i18n/routing";

export type WikidataId = `Q${number}`;

export interface WikidataClaimSource {
  entityId: WikidataId;
  propertyId: `P${number}`;
  apiUrl: string;
}

export interface HistoricalDate {
  year: number;
  month: number | null;
  day: number | null;
  precision: number;
  calendarModel: string | null;
  source: WikidataClaimSource;
}

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  precision: number | null;
  globe: string | null;
  source: WikidataClaimSource;
}

export interface CommonsImage {
  fileName: string;
  originalUrl: string | null;
  thumbnailUrl: string | null;
  descriptionUrl: string | null;
  artist: string | null;
  credit: string | null;
  license: string | null;
  licenseUrl: string | null;
}

export type LifeEventKind = "birth" | "education" | "residence" | "work" | "death";

export interface HistoricalLifeEvent {
  kind: LifeEventKind;
  placeId: WikidataId;
  startDate: HistoricalDate | null;
  endDate: HistoricalDate | null;
  source: WikidataClaimSource;
}

export interface NormalizedPhilosopher {
  wikidataId: WikidataId;
  birthDate: HistoricalDate | null;
  deathDate: HistoricalDate | null;
  birthPlaceId: WikidataId | null;
  schoolIds: WikidataId[];
  influencedByIds: WikidataId[];
  lifeEvents: HistoricalLifeEvent[];
  image: CommonsImage | null;
}

export interface NormalizedPlace {
  wikidataId: WikidataId;
  coordinates: GeoCoordinates | null;
}

export interface NormalizedSchool {
  wikidataId: WikidataId;
}

export interface SourceSummary {
  text: string;
  sourceUrl: string;
  retrievedAt: string;
  language: AppLocale;
}

export interface PhilosopherLocalization {
  name: string | null;
  /** Manually edited copy. Data import scripts must preserve this field. */
  summary: string | null;
  wikidataDescription: string | null;
  sourceSummary: SourceSummary | null;
  wikipediaTitle: string | null;
}

export interface LocaleData {
  philosophers: Record<WikidataId, PhilosopherLocalization>;
  places: Record<WikidataId, string | null>;
  schools: Record<WikidataId, string | null>;
  people: Record<WikidataId, string | null>;
}

export interface GeneratedPhilosopherData {
  schemaVersion: 3;
  generatedAt: string;
  source: {
    wikidataApi: string;
    commonsApi: string;
    entityIds: WikidataId[];
    properties: Record<string, `P${number}`>;
    userAgent: string;
  };
  philosophers: NormalizedPhilosopher[];
  places: NormalizedPlace[];
  schools: NormalizedSchool[];
  localizations: Record<AppLocale, LocaleData>;
}

export interface SourceLink {
  title: string;
  url: string;
}

export interface InfluenceViewModel {
  id: WikidataId;
  name: string;
  inAtlas: boolean;
  url: string;
}

export interface LifeEventViewModel {
  kind: LifeEventKind;
  placeId: WikidataId;
  placeName: string;
  latitude: number;
  longitude: number;
  startYear: number | null;
  endYear: number | null;
  source: SourceLink;
}

export interface PhilosopherViewModel {
  id: WikidataId;
  wikidataId: WikidataId;
  name: string;
  birthYear: number;
  deathYear: number;
  birthPlace: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
  imageAttribution: CommonsImage | null;
  schoolLabels: string[];
  summary: string | null;
  influencedBy: InfluenceViewModel[];
  influenced: InfluenceViewModel[];
  lifeEvents: LifeEventViewModel[];
  sources: SourceLink[];
}
