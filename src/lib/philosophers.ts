import generatedData from "../../data/philosophers.generated.json";
import type {AppLocale} from "@/i18n/routing";
import type {
  CommonsImage,
  GeneratedPhilosopherData,
  InfluenceViewModel,
  LocaleData,
  LifeEventViewModel,
  PhilosopherViewModel,
  WikidataId,
} from "@/types/philosopher";
import {createSupabaseClient} from "@/lib/supabase";
import {editorialSummary} from "@/lib/editorial-summaries";
import type {
  ImageRow,
  InfluenceRow,
  PhilosopherLocationRow,
  PhilosopherRow,
  PhilosopherTranslationRow,
  PlaceRow,
  PlaceTranslationRow,
  SourceRow,
} from "@/types/database";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isWikidataId(value: unknown): value is WikidataId {
  return typeof value === "string" && /^Q\d+$/.test(value);
}

function parseGeneratedData(value: unknown): GeneratedPhilosopherData {
  if (!isRecord(value) || value.schemaVersion !== 3) {
    throw new Error("The generated philosopher dataset has an unsupported schema.");
  }

  if (
    !Array.isArray(value.philosophers) ||
    !Array.isArray(value.places) ||
    !Array.isArray(value.schools) ||
    !isRecord(value.localizations) ||
    !isRecord(value.localizations.en) ||
    !isRecord(value.localizations.tr)
  ) {
    throw new Error("The generated philosopher dataset is incomplete.");
  }

  const invalidPhilosopher = value.philosophers.some(
    (entry) => !isRecord(entry) || !isWikidataId(entry.wikidataId),
  );
  if (invalidPhilosopher) throw new Error("The generated dataset contains an invalid philosopher ID.");

  return value as unknown as GeneratedPhilosopherData;
}

const data = parseGeneratedData(generatedData);

// Wikidata occasionally classifies a person's education or interests as
// philosophy without a substantial philosophical body of work. Keep these
// records in the raw import for provenance, but exclude them from the atlas.
const EXCLUDED_ATLAS_IDS = new Set<WikidataId>([
  "Q7071", // Li Bai, poet
  "Q3052772", // Emmanuel Macron, politician
  "Q81731", // Murasaki Shikibu, novelist and poet
  "Q164765", // Alexander Blok, poet
  "Q185", // Larry Sanger, technology founder
]);

function wikipediaUrl(locale: AppLocale, title: string) {
  return `https://${locale}.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(" ", "_"))}`;
}

function conciseSummary(summary: string | null) {
  if (!summary) return null;
  const cleaned = summary
    .replace(/\([^()]{0,220}\)/gu, "")
    .replace(/\s+/gu, " ")
    .replace(/\s+([,.;:!?])/gu, "$1")
    .trim();
  const sentences = cleaned.split(/(?<=[.!?])\s+/u).filter(Boolean);
  const selected = sentences.slice(0, 3).join(" ");
  if (selected.length <= 720) return selected;

  const shortened = selected.slice(0, 717);
  const lastSpace = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, Math.max(lastSpace, 0)).trimEnd()}…`;
}

const LOWERCASE_SCHOOL_WORDS = new Set(["and", "of", "the", "ve"]);

function normalizeSchoolLabel(label: string) {
  return label
    .split(/\s+/u)
    .map((word, index) => {
      if (!word) return word;
      if (index > 0 && LOWERCASE_SCHOOL_WORDS.has(word.toLocaleLowerCase("en"))) {
        return word.toLocaleLowerCase("en");
      }
      if (word !== word.toLocaleLowerCase("en")) return word;

      const [first = "", ...rest] = [...word];
      return `${first.toLocaleUpperCase("en")}${rest.join("")}`;
    })
    .join(" ");
}

function schoolLabelsForLocale(ids: WikidataId[], locale: LocaleData, fallback: LocaleData) {
  return [...new Set(ids.flatMap((schoolId) => {
    const label = locale.schools[schoolId] ?? fallback.schools[schoolId];
    return label ? [normalizeSchoolLabel(label)] : [];
  }))];
}

const LIFE_EVENT_ORDER = {
  birth: 0,
  education: 1,
  residence: 2,
  work: 3,
  death: 4,
} as const;

function isLifeEventKind(value: string): value is keyof typeof LIFE_EVENT_ORDER {
  return value in LIFE_EVENT_ORDER;
}

function getLocalPhilosophers(locale: AppLocale): PhilosopherViewModel[] {
  const localized = data.localizations[locale];
  const english = data.localizations.en;
  const placesById = new Map(data.places.map((place) => [place.wikidataId, place]));
  const philosophersById = new Map(
    data.philosophers.map((philosopher) => [philosopher.wikidataId, philosopher]),
  );
  const influencedByTarget = new Map<WikidataId, WikidataId[]>();
  for (const candidate of data.philosophers) {
    for (const targetId of candidate.influencedByIds) {
      const current = influencedByTarget.get(targetId) ?? [];
      current.push(candidate.wikidataId);
      influencedByTarget.set(targetId, current);
    }
  }

  function influence(id: WikidataId): InfluenceViewModel {
    const atlasTranslation = localized.philosophers[id] ?? english.philosophers[id];
    return {
      id,
      name:
        atlasTranslation?.name ??
        localized.people[id] ??
        english.people[id] ??
        id,
      inAtlas: philosophersById.has(id),
      url: `https://www.wikidata.org/wiki/${id}`,
    };
  }

  return data.philosophers.flatMap((philosopher) => {
    if (EXCLUDED_ATLAS_IDS.has(philosopher.wikidataId)) return [];
    const birthPlace = philosopher.birthPlaceId
      ? placesById.get(philosopher.birthPlaceId)
      : undefined;
    const coordinates = birthPlace?.coordinates;

    if (!philosopher.birthDate || !philosopher.deathDate || !birthPlace || !coordinates) {
      return [];
    }

    const translation = localized.philosophers[philosopher.wikidataId];
    const englishTranslation = english.philosophers[philosopher.wikidataId];
    const name =
      translation?.name ??
      englishTranslation?.name ??
      translation?.wikipediaTitle ??
      englishTranslation?.wikipediaTitle ??
      philosopher.wikidataId;
    const wikipediaTitle = translation?.wikipediaTitle ?? null;
    const birthPlaceName =
      localized.places[birthPlace.wikidataId] ??
      english.places[birthPlace.wikidataId] ??
      birthPlace.wikidataId;
    const schoolLabels = schoolLabelsForLocale(philosopher.schoolIds, localized, english);

    return [{
      id: philosopher.wikidataId,
      wikidataId: philosopher.wikidataId,
      name,
      birthYear: philosopher.birthDate.year,
      deathYear: philosopher.deathDate.year,
      birthPlace: birthPlaceName,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      imageUrl:
        philosopher.image?.thumbnailUrl ??
        philosopher.image?.originalUrl ??
        "/portraits/ancient-greek.svg",
      imageAttribution: philosopher.image,
      schoolLabels,
      summary:
        editorialSummary(philosopher.wikidataId, locale) ??
        conciseSummary(translation?.summary ?? translation?.sourceSummary?.text ?? translation?.wikidataDescription ?? null),
      influencedBy: philosopher.influencedByIds.map(influence),
      influenced: (influencedByTarget.get(philosopher.wikidataId) ?? []).map(influence),
      lifeEvents: philosopher.lifeEvents
        .flatMap((event) => {
          const place = placesById.get(event.placeId);
          if (!place?.coordinates) return [];
          return [{
            kind: event.kind,
            placeId: event.placeId,
            placeName:
              localized.places[event.placeId] ??
              english.places[event.placeId] ??
              event.placeId,
            latitude: place.coordinates.latitude,
            longitude: place.coordinates.longitude,
            startYear: event.startDate?.year ?? null,
            endYear: event.endDate?.year ?? null,
            source: {title: "Wikidata", url: event.source.apiUrl},
          } satisfies LifeEventViewModel];
        })
        .sort((left, right) => {
          if (left.kind === "birth") return -1;
          if (right.kind === "birth") return 1;
          if (left.kind === "death") return 1;
          if (right.kind === "death") return -1;
          if (left.startYear !== null && right.startYear !== null) {
            return left.startYear - right.startYear;
          }
          return LIFE_EVENT_ORDER[left.kind] - LIFE_EVENT_ORDER[right.kind];
        }),
      sources: [
        {
          title: "Wikidata",
          url: `https://www.wikidata.org/wiki/${philosopher.wikidataId}`,
        },
        ...(translation?.sourceSummary?.sourceUrl || wikipediaTitle
          ? [{
              title: "Wikipedia",
              url: translation?.sourceSummary?.sourceUrl ?? wikipediaUrl(locale, wikipediaTitle!),
            }]
          : []),
      ],
    } satisfies PhilosopherViewModel];
  });
}

async function getSupabasePhilosophers(locale: AppLocale): Promise<PhilosopherViewModel[]> {
  const supabase = createSupabaseClient();
  if (!supabase) {
    throw new Error(
      "Supabase is selected but SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY is missing.",
    );
  }

  const languages = locale === "en" ? ["en"] : [locale, "en"];
  const [
    philosophersResult,
    translationsResult,
    locationsResult,
    placesResult,
    placeNamesResult,
    imagesResult,
    influencesResult,
    sourcesResult,
  ] =
    await Promise.all([
      supabase.from("philosophers").select("*").overrideTypes<PhilosopherRow[], {merge: false}>(),
      supabase
        .from("philosopher_translations")
        .select("*")
        .in("language_code", languages)
        .overrideTypes<PhilosopherTranslationRow[], {merge: false}>(),
      supabase
        .from("philosopher_locations")
        .select("*")
        .overrideTypes<PhilosopherLocationRow[], {merge: false}>(),
      supabase.from("places").select("*").overrideTypes<PlaceRow[], {merge: false}>(),
      supabase
        .from("place_translations")
        .select("*")
        .in("language_code", languages)
        .overrideTypes<PlaceTranslationRow[], {merge: false}>(),
      supabase
        .from("images")
        .select("*")
        .eq("is_primary", true)
        .overrideTypes<ImageRow[], {merge: false}>(),
      supabase.from("influences").select("*").overrideTypes<InfluenceRow[], {merge: false}>(),
      supabase.from("sources").select("*").overrideTypes<SourceRow[], {merge: false}>(),
    ]);

  const failedResult = [
    philosophersResult,
    translationsResult,
    locationsResult,
    placesResult,
    placeNamesResult,
    imagesResult,
    influencesResult,
    sourcesResult,
  ].find((result) => result.error);
  if (failedResult?.error) throw failedResult.error;

  const translations = new Map(
    (translationsResult.data ?? []).map((translation) => [
      `${translation.philosopher_id}:${translation.language_code}`,
      translation,
    ]),
  );
  const birthLocations = new Map(
    (locationsResult.data ?? [])
      .filter((location) => location.relationship === "birth")
      .map((location) => [location.philosopher_id, location]),
  );
  const places = new Map((placesResult.data ?? []).map((place) => [place.id, place]));
  const placeNames = new Map(
    (placeNamesResult.data ?? []).map((place) => [
      `${place.place_id}:${place.language_code}`,
      place.name,
    ]),
  );
  const images = new Map(
    (imagesResult.data ?? []).map((image) => [image.philosopher_id, image]),
  );
  const philosophersByDatabaseId = new Map(
    (philosophersResult.data ?? []).map((philosopher) => [philosopher.id, philosopher]),
  );
  const sources = new Map((sourcesResult.data ?? []).map((source) => [source.id, source]));

  function databaseInfluence(id: string, activeLocale: AppLocale): InfluenceViewModel | null {
    const related = philosophersByDatabaseId.get(id);
    if (!related || !isWikidataId(related.wikidata_id)) return null;
    const translation =
      translations.get(`${related.id}:${activeLocale}`) ??
      translations.get(`${related.id}:en`);
    return {
      id: related.wikidata_id,
      name: translation?.name ?? related.wikidata_id,
      inAtlas: true,
      url: `https://www.wikidata.org/wiki/${related.wikidata_id}`,
    };
  }

  return (philosophersResult.data ?? []).flatMap((philosopher) => {
    if (
      !isWikidataId(philosopher.wikidata_id) ||
      philosopher.birth_year === null ||
      philosopher.death_year === null
    ) {
      return [];
    }

    const location = birthLocations.get(philosopher.id);
    const place = location ? places.get(location.place_id) : undefined;
    if (!place || place.latitude === null || place.longitude === null) return [];

    const translation =
      translations.get(`${philosopher.id}:${locale}`) ??
      translations.get(`${philosopher.id}:en`);
    const image = images.get(philosopher.id);
    const imageAttribution = image
      ? ({
          fileName: image.commons_filename ?? "",
          originalUrl: image.original_url,
          thumbnailUrl: image.thumbnail_url,
          descriptionUrl: image.description_url,
          artist: image.creator,
          credit: image.credit,
          license: image.license,
          licenseUrl: image.license_url,
        } satisfies CommonsImage)
      : null;
    const wikipediaTitle = translation?.wikipedia_title ?? null;
    const wikipediaSource =
      translation?.source_summary_url ??
      (wikipediaTitle ? wikipediaUrl(locale, wikipediaTitle) : null);
    const name = translation?.name ?? philosopher.wikidata_id;
    const schoolLabels = [...new Set((translation?.school_labels ?? []).map(normalizeSchoolLabel))];

    return [{
      id: philosopher.wikidata_id,
      wikidataId: philosopher.wikidata_id,
      name,
      birthYear: philosopher.birth_year,
      deathYear: philosopher.death_year,
      birthPlace:
        placeNames.get(`${place.id}:${locale}`) ??
        placeNames.get(`${place.id}:en`) ??
        place.wikidata_id ??
        philosopher.wikidata_id,
      latitude: place.latitude,
      longitude: place.longitude,
      imageUrl:
        image?.thumbnail_url ?? image?.original_url ?? "/portraits/ancient-greek.svg",
      imageAttribution,
      schoolLabels,
      summary:
        editorialSummary(philosopher.wikidata_id, locale) ??
        conciseSummary(translation?.summary ?? translation?.source_summary ?? translation?.wikidata_description ?? null),
      influencedBy: (influencesResult.data ?? []).flatMap((relation) => {
        if (relation.influenced_id !== philosopher.id) return [];
        const item = databaseInfluence(relation.influencer_id, locale);
        return item ? [item] : [];
      }),
      influenced: (influencesResult.data ?? []).flatMap((relation) => {
        if (relation.influencer_id !== philosopher.id) return [];
        const item = databaseInfluence(relation.influenced_id, locale);
        return item ? [item] : [];
      }),
      lifeEvents: (locationsResult.data ?? [])
        .flatMap((event) => {
          if (event.philosopher_id !== philosopher.id || !isLifeEventKind(event.relationship)) {
            return [];
          }
          const eventPlace = places.get(event.place_id);
          if (
            !eventPlace ||
            !isWikidataId(eventPlace.wikidata_id) ||
            eventPlace.latitude === null ||
            eventPlace.longitude === null
          ) {
            return [];
          }
          const eventSource = event.source_id ? sources.get(event.source_id) : null;
          return [{
            kind: event.relationship,
            placeId: eventPlace.wikidata_id,
            placeName:
              placeNames.get(`${eventPlace.id}:${locale}`) ??
              placeNames.get(`${eventPlace.id}:en`) ??
              eventPlace.wikidata_id ??
              philosopher.wikidata_id,
            latitude: eventPlace.latitude,
            longitude: eventPlace.longitude,
            startYear: event.start_year,
            endYear: event.end_year,
            source: eventSource
              ? {title: eventSource.title, url: eventSource.url}
              : {
                  title: "Wikidata",
                  url: `https://www.wikidata.org/wiki/${philosopher.wikidata_id}`,
                },
          } satisfies LifeEventViewModel];
        })
        .sort((left, right) => {
          if (left.kind === "birth") return -1;
          if (right.kind === "birth") return 1;
          if (left.kind === "death") return 1;
          if (right.kind === "death") return -1;
          if (left.startYear !== null && right.startYear !== null) {
            return left.startYear - right.startYear;
          }
          return LIFE_EVENT_ORDER[left.kind] - LIFE_EVENT_ORDER[right.kind];
        }),
      sources: [
        {
          title: "Wikidata",
          url: `https://www.wikidata.org/wiki/${philosopher.wikidata_id}`,
        },
        ...(wikipediaSource ? [{title: "Wikipedia", url: wikipediaSource}] : []),
      ],
    } satisfies PhilosopherViewModel];
  });
}

export async function getPhilosophers(locale: AppLocale): Promise<PhilosopherViewModel[]> {
  const dataSource = process.env.PHILOSOPHER_DATA_SOURCE ?? "local";
  if (dataSource === "local") return getLocalPhilosophers(locale);
  if (dataSource !== "supabase") {
    throw new Error('PHILOSOPHER_DATA_SOURCE must be either "local" or "supabase".');
  }

  try {
    return await getSupabasePhilosophers(locale);
  } catch (error) {
    if (process.env.NODE_ENV === "production") throw error;
    console.warn("Supabase data loading failed; using the local JSON fallback.", error);
    return getLocalPhilosophers(locale);
  }
}
