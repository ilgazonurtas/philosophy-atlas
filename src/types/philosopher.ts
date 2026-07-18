import type {AppLocale} from "@/i18n/routing";

export type LocalizedText = Record<AppLocale, string>;

export interface Source {
  title: string;
  url: string;
}

export interface Philosopher {
  id: string;
  name: string;
  birthYear: number;
  deathYear: number;
  birthPlace: LocalizedText;
  latitude: number;
  longitude: number;
  imageUrl: string;
  school: LocalizedText;
  summary: LocalizedText;
  influencedBy: string[];
  sources: Source[];
}
