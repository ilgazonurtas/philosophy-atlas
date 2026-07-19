export type Json =
  | string
  | number
  | boolean
  | null
  | {[key: string]: Json | undefined}
  | Json[];

type Timestamps = {
  created_at: string;
  updated_at: string;
};

export type SourceRow = Timestamps & {
  id: string;
  title: string;
  url: string;
  publisher: string | null;
  language_code: string | null;
  retrieved_at: string | null;
  source_type: string;
  license: string | null;
  citation: string | null;
  metadata: Json;
};

export type PlaceRow = Timestamps & {
  id: string;
  wikidata_id: string | null;
  latitude: number | null;
  longitude: number | null;
  coordinate_precision: number | null;
  coordinate_globe: string | null;
  coordinate_source_id: string | null;
  coordinate_confidence: number | null;
};

export type PlaceTranslationRow = Timestamps & {
  place_id: string;
  language_code: string;
  name: string;
  source_id: string | null;
  confidence: number | null;
};

export type PhilosopherRow = Timestamps & {
  id: string;
  wikidata_id: string;
  birth_year: number | null;
  birth_month: number | null;
  birth_day: number | null;
  birth_precision: number | null;
  birth_source_id: string | null;
  birth_confidence: number | null;
  death_year: number | null;
  death_month: number | null;
  death_day: number | null;
  death_precision: number | null;
  death_source_id: string | null;
  death_confidence: number | null;
};

export type PhilosopherTranslationRow = Timestamps & {
  philosopher_id: string;
  language_code: string;
  name: string;
  summary: string | null;
  wikidata_description: string | null;
  source_summary: string | null;
  source_summary_url: string | null;
  source_summary_retrieved_at: string | null;
  source_summary_language: string | null;
  wikipedia_title: string | null;
  school_labels: string[];
  source_id: string | null;
  confidence: number | null;
};

export type PhilosopherLocationRow = Timestamps & {
  id: string;
  philosopher_id: string;
  place_id: string;
  relationship: string;
  start_year: number | null;
  end_year: number | null;
  source_id: string | null;
  confidence: number | null;
  notes: string | null;
};

export type InfluenceRow = Timestamps & {
  id: string;
  influencer_id: string;
  influenced_id: string;
  source_id: string | null;
  confidence: number | null;
  notes: string | null;
};

export type ImageRow = Timestamps & {
  id: string;
  philosopher_id: string;
  commons_filename: string | null;
  original_url: string | null;
  thumbnail_url: string | null;
  description_url: string | null;
  creator: string | null;
  credit: string | null;
  license: string | null;
  license_url: string | null;
  source_id: string | null;
  confidence: number | null;
  is_primary: boolean;
};

type TableDefinition<
  Row extends Record<string, unknown>,
  Insert extends Record<string, unknown> = Partial<Row>,
> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Insert>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      sources: TableDefinition<SourceRow, Partial<SourceRow> & Pick<SourceRow, "title" | "url">>;
      places: TableDefinition<PlaceRow>;
      place_translations: TableDefinition<
        PlaceTranslationRow,
        Partial<PlaceTranslationRow> & Pick<PlaceTranslationRow, "place_id" | "language_code" | "name">
      >;
      philosophers: TableDefinition<
        PhilosopherRow,
        Partial<PhilosopherRow> & Pick<PhilosopherRow, "wikidata_id">
      >;
      philosopher_translations: TableDefinition<
        PhilosopherTranslationRow,
        Partial<PhilosopherTranslationRow> &
          Pick<PhilosopherTranslationRow, "philosopher_id" | "language_code" | "name">
      >;
      philosopher_locations: TableDefinition<
        PhilosopherLocationRow,
        Partial<PhilosopherLocationRow> &
          Pick<PhilosopherLocationRow, "philosopher_id" | "place_id" | "relationship">
      >;
      influences: TableDefinition<
        InfluenceRow,
        Partial<InfluenceRow> & Pick<InfluenceRow, "influencer_id" | "influenced_id">
      >;
      images: TableDefinition<
        ImageRow,
        Partial<ImageRow> & Pick<ImageRow, "philosopher_id">
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
