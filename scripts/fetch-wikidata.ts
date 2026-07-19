import {mkdir, readFile, writeFile} from "node:fs/promises";
import {dirname, resolve} from "node:path";
import type {
  CommonsImage,
  GeneratedPhilosopherData,
  GeoCoordinates,
  HistoricalDate,
  HistoricalLifeEvent,
  LocaleData,
  NormalizedPhilosopher,
  NormalizedPlace,
  NormalizedSchool,
  WikidataClaimSource,
  WikidataId,
} from "../src/types/philosopher";

const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const WIKIDATA_SPARQL = "https://query.wikidata.org/sparql";
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const USER_AGENT =
  "PhiloAtlasDataFetcher/1.0 (https://github.com/ilgazonurtas/philosophy-atlas; data refresh script)";
const OUTPUT_PATH = resolve(process.cwd(), "data", "philosophers.generated.json");
const REQUEST_INTERVAL_MS = 350;
const MAX_RETRIES = 4;
const LOCALES = ["en", "tr"] as const;

const PHILOSOPHERS = [
  {id: "Q4604", expectedEnglishLabel: "Confucius"},
  {id: "Q913", expectedEnglishLabel: "Socrates"},
  {id: "Q859", expectedEnglishLabel: "Plato"},
  {id: "Q868", expectedEnglishLabel: "Aristotle"},
  {id: "Q43216", expectedEnglishLabel: "Epicurus"},
  {id: "Q11903", expectedEnglishLabel: "Hypatia"},
  {id: "Q8011", expectedEnglishLabel: "Avicenna"},
  {id: "Q9191", expectedEnglishLabel: "René Descartes"},
  {id: "Q101638", expectedEnglishLabel: "Mary Wollstonecraft"},
  {id: "Q9358", expectedEnglishLabel: "Friedrich Nietzsche"},
  {id: "Q36303", expectedEnglishLabel: "Thales"},
  {id: "Q42458", expectedEnglishLabel: "Anaximander"},
  {id: "Q80612", expectedEnglishLabel: "Anaximenes of Miletus"},
  {id: "Q10261", expectedEnglishLabel: "Pythagoras"},
  {id: "Q131671", expectedEnglishLabel: "Xenophanes"},
  {id: "Q41155", expectedEnglishLabel: "Heraclitus"},
  {id: "Q125551", expectedEnglishLabel: "Parmenides"},
  {id: "Q83041", expectedEnglishLabel: "Anaxagoras"},
  {id: "Q83375", expectedEnglishLabel: "Empedocles"},
  {id: "Q132157", expectedEnglishLabel: "Zeno of Elea"},
  {id: "Q169243", expectedEnglishLabel: "Protagoras"},
  {id: "Q179785", expectedEnglishLabel: "Gorgias"},
  {id: "Q41980", expectedEnglishLabel: "Democritus"},
  {id: "Q179149", expectedEnglishLabel: "Antisthenes"},
  {id: "Q189506", expectedEnglishLabel: "Aristippus"},
  {id: "Q59180", expectedEnglishLabel: "Diogenes of Sinope"},
  {id: "Q160362", expectedEnglishLabel: "Theophrastus"},
  {id: "Q192313", expectedEnglishLabel: "Pyrrho"},
  {id: "Q171303", expectedEnglishLabel: "Zeno of Citium"},
  {id: "Q310149", expectedEnglishLabel: "Cleanthes"},
  {id: "Q211411", expectedEnglishLabel: "Chrysippus of Soli"},
  // Additional philosophers, social thinkers, mathematicians, and scientists.
  {id: "Q937", expectedEnglishLabel: "Albert Einstein"},
  {id: "Q935", expectedEnglishLabel: "Isaac Newton"},
  {id: "Q307", expectedEnglishLabel: "Galileo Galilei"},
  {id: "Q1035", expectedEnglishLabel: "Charles Darwin"},
  {id: "Q7186", expectedEnglishLabel: "Marie Curie"},
  {id: "Q7259", expectedEnglishLabel: "Ada Lovelace"},
  {id: "Q7251", expectedEnglishLabel: "Alan Turing"},
  {id: "Q9036", expectedEnglishLabel: "Stephen Hawking"},
  {id: "Q619", expectedEnglishLabel: "Nicolaus Copernicus"},
  {id: "Q8963", expectedEnglishLabel: "Johannes Kepler"},
  {id: "Q40454", expectedEnglishLabel: "Christiaan Huygens"},
  {id: "Q8759", expectedEnglishLabel: "Michael Faraday"},
  {id: "Q131977", expectedEnglishLabel: "James Clerk Maxwell"},
  {id: "Q57235", expectedEnglishLabel: "Louis Pasteur"},
  {id: "Q5705", expectedEnglishLabel: "Gregor Mendel"},
  {id: "Q35448", expectedEnglishLabel: "Max Planck"},
  {id: "Q7085", expectedEnglishLabel: "Niels Bohr"},
  {id: "Q34296", expectedEnglishLabel: "Richard Feynman"},
  {id: "Q8759", expectedEnglishLabel: "Michael Faraday"},
  {id: "Q1748", expectedEnglishLabel: "Karl Marx"},
  {id: "Q9353", expectedEnglishLabel: "David Hume"},
  {id: "Q8486", expectedEnglishLabel: "John Locke"},
  {id: "Q9068", expectedEnglishLabel: "Voltaire"},
  {id: "Q6527", expectedEnglishLabel: "Jean-Jacques Rousseau"},
  {id: "Q38193", expectedEnglishLabel: "Arthur Schopenhauer"},
  {id: "Q9047", expectedEnglishLabel: "Gottfried Wilhelm Leibniz"},
  {id: "Q9312", expectedEnglishLabel: "Immanuel Kant"},
  {id: "Q567", expectedEnglishLabel: "Georg Wilhelm Friedrich Hegel"},
  {id: "Q5593", expectedEnglishLabel: "Søren Kierkegaard"},
  {id: "Q6007", expectedEnglishLabel: "Hannah Arendt"},
  {id: "Q41568", expectedEnglishLabel: "Michel de Montaigne"},
  {id: "Q5293", expectedEnglishLabel: "Simone de Beauvoir"},
  {id: "Q134192", expectedEnglishLabel: "Jean-Paul Sartre"},
  {id: "Q150100", expectedEnglishLabel: "Albert Camus"},
  {id: "Q44272", expectedEnglishLabel: "Ludwig Wittgenstein"},
  {id: "Q41185", expectedEnglishLabel: "Martin Heidegger"},
  {id: "Q8337", expectedEnglishLabel: "Michel Foucault"},
  {id: "Q5729", expectedEnglishLabel: "John Dewey"},
  {id: "Q4534", expectedEnglishLabel: "William James"},
  {id: "Q7243", expectedEnglishLabel: "Mary Astell"},
  {id: "Q44481", expectedEnglishLabel: "Olympe de Gouges"},
  {id: "Q23434", expectedEnglishLabel: "Rachel Carson"},
  {id: "Q161743", expectedEnglishLabel: "Rosalind Franklin"},
  {id: "Q208314", expectedEnglishLabel: "Katherine Johnson"},
  {id: "Q2963", expectedEnglishLabel: "George Washington Carver"},
  {id: "Q161433", expectedEnglishLabel: "Emmy Noether"},
  {id: "Q169470", expectedEnglishLabel: "Srinivasa Ramanujan"},
] as const satisfies readonly {id: WikidataId; expectedEnglishLabel: string}[];

const CORE_PHILOSOPHERS = PHILOSOPHERS.slice(0, 31);
const ADDITIONAL_PHILOSOPHER_COUNT = 200;
const EXCLUDED_IDS = new Set<WikidataId>([
  "Q7071", // Li Bai, poet
  "Q3052772", // Emmanuel Macron, politician
  "Q81731", // Murasaki Shikibu, novelist and poet
  "Q164765", // Alexander Blok, poet
  "Q185", // Larry Sanger, technology founder
]);

const PROPERTIES = {
  birthDate: "P569",
  deathDate: "P570",
  birthPlace: "P19",
  coordinates: "P625",
  image: "P18",
  school: "P135",
  influencedBy: "P737",
  deathPlace: "P20",
  educatedAt: "P69",
  residence: "P551",
  workLocation: "P937",
  startTime: "P580",
  endTime: "P582",
} as const;

interface WikibaseTerm {
  language: string;
  value: string;
}

interface WikibaseSiteLink {
  title: string;
}

interface WikibaseStatement {
  rank?: "preferred" | "normal" | "deprecated";
  mainsnak?: {
    snaktype?: string;
    datavalue?: {
      type?: string;
      value?: unknown;
    };
  };
  qualifiers?: Record<string, Array<{
    snaktype?: string;
    datavalue?: {type?: string; value?: unknown};
  }>>;
}

interface WikibaseEntity {
  id: string;
  missing?: string;
  labels?: Record<string, WikibaseTerm>;
  descriptions?: Record<string, WikibaseTerm>;
  claims?: Record<string, WikibaseStatement[]>;
  sitelinks?: Record<string, WikibaseSiteLink>;
}

interface WikibaseResponse {
  success?: number;
  entities?: Record<string, WikibaseEntity>;
}

interface SparqlResponse {
  results?: {
    bindings?: Array<{
      person?: {value?: string};
      continent?: {value?: string};
      popularity?: {value?: string};
      sitelinks?: {value?: string};
    }>;
  };
}

interface CommonsMetadataValue {
  value?: string;
}

interface CommonsImageInfo {
  url?: string;
  thumburl?: string;
  descriptionurl?: string;
  extmetadata?: Record<string, CommonsMetadataValue>;
}

interface CommonsPage {
  title?: string;
  missing?: boolean;
  imageinfo?: CommonsImageInfo[];
}

interface CommonsResponse {
  query?: {
    pages?: CommonsPage[] | Record<string, CommonsPage>;
  };
}

interface EntityValue {
  id?: string;
  "entity-type"?: string;
}

interface TimeValue {
  time?: string;
  precision?: number;
  calendarmodel?: string;
}

interface CoordinateValue {
  latitude?: number;
  longitude?: number;
  precision?: number;
  globe?: string;
}

let earliestNextRequest = 0;

class NonRetryableRequestError extends Error {}

function sleep(milliseconds: number) {
  return new Promise<void>((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

async function waitForRateLimit() {
  const waitTime = Math.max(0, earliestNextRequest - Date.now());
  if (waitTime > 0) await sleep(waitTime);
  earliestNextRequest = Date.now() + REQUEST_INTERVAL_MS;
}

function retryDelay(response: Response, attempt: number) {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return seconds * 1000;

    const date = Date.parse(retryAfter);
    if (Number.isFinite(date)) return Math.max(0, date - Date.now());
  }

  return 750 * 2 ** attempt;
}

async function fetchJson<T>(url: URL): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    await waitForRateLimit();

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "Api-User-Agent": USER_AGENT,
          "User-Agent": USER_AGENT,
        },
        signal: AbortSignal.timeout(20_000),
      });

      if (response.ok) return (await response.json()) as T;

      const message = `${response.status} ${response.statusText} for ${url.origin}${url.pathname}`;
      if (response.status !== 429 && response.status < 500) {
        throw new NonRetryableRequestError(message);
      }

      lastError = new Error(message);
      if (attempt < MAX_RETRIES) await sleep(retryDelay(response, attempt));
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (error instanceof NonRetryableRequestError) throw error;
      if (attempt < MAX_RETRIES) await sleep(750 * 2 ** attempt);
    }
  }

  throw new Error(`Request failed after ${MAX_RETRIES + 1} attempts: ${lastError?.message ?? "unknown error"}`);
}

function chunks<T>(values: readonly T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

async function discoverAdditionalPhilosophers(coreIds: readonly WikidataId[]) {
  const query = `
SELECT ?person ?sitelinks WHERE {
  ?person wdt:P31 wd:Q5;
          wdt:P106 wd:Q4964182;
          wikibase:sitelinks ?sitelinks.
}
ORDER BY DESC(?sitelinks)
LIMIT 500`;
  const url = new URL(WIKIDATA_SPARQL);
  url.search = new URLSearchParams({query, format: "json"}).toString();
  const response = await fetchJson<SparqlResponse>(url);
  const excluded = new Set(coreIds);
  const candidates = (response.results?.bindings ?? []).flatMap((binding) => {
    const id = binding.person?.value?.match(/\/entity\/(Q\d+)$/)?.[1];
    if (!id || !isWikidataId(id) || excluded.has(id) || EXCLUDED_IDS.has(id)) return [];
    return [{id, popularity: Number(binding.sitelinks?.value ?? 0)}];
  });
  const selected = candidates.slice(0, ADDITIONAL_PHILOSOPHER_COUNT).map(({id}) => id);
  if (selected.length !== ADDITIONAL_PHILOSOPHER_COUNT) {
    throw new Error(`Wikidata returned only ${selected.length} eligible additional philosophers`);
  }
  return selected;
}

async function fetchEntities(
  ids: readonly WikidataId[],
  props: string,
  siteFilter?: string,
): Promise<Map<WikidataId, WikibaseEntity>> {
  const result = new Map<WikidataId, WikibaseEntity>();

  for (const idBatch of chunks(ids, 50)) {
    const url = new URL(WIKIDATA_API);
    url.search = new URLSearchParams({
      action: "wbgetentities",
      format: "json",
      formatversion: "2",
      ids: idBatch.join("|"),
      languages: LOCALES.join("|"),
      props,
      ...(siteFilter ? {sitefilter: siteFilter} : {}),
    }).toString();

    const response = await fetchJson<WikibaseResponse>(url);
    if (response.success !== 1 || !response.entities) {
      throw new Error(`Wikidata returned an invalid entity response for ${idBatch.join(", ")}`);
    }

    for (const [id, entity] of Object.entries(response.entities)) {
      if (entity.missing !== undefined) throw new Error(`Wikidata entity ${id} does not exist`);
      if (/^Q\d+$/.test(id)) result.set(id as WikidataId, entity);
    }
  }

  return result;
}

function statements(entity: WikibaseEntity, propertyId: string) {
  const values = (entity.claims?.[propertyId] ?? []).filter(
    (statement) => statement.rank !== "deprecated" && statement.mainsnak?.snaktype === "value",
  );
  const preferred = values.filter((statement) => statement.rank === "preferred");
  return preferred.length > 0 ? preferred : values;
}

function statementValue(entity: WikibaseEntity, propertyId: string) {
  return statements(entity, propertyId)[0]?.mainsnak?.datavalue?.value;
}

function isWikidataId(value: unknown): value is WikidataId {
  return typeof value === "string" && /^Q\d+$/.test(value);
}

function entityIdFromValue(value: unknown): WikidataId | null {
  if (typeof value !== "object" || value === null) return null;
  const entity = value as EntityValue;
  return entity["entity-type"] === "item" && isWikidataId(entity.id) ? entity.id : null;
}

function entityIds(entity: WikibaseEntity, propertyId: string) {
  return statements(entity, propertyId)
    .map((statement) => entityIdFromValue(statement.mainsnak?.datavalue?.value))
    .filter((id): id is WikidataId => id !== null);
}

function claimSource(entityId: WikidataId, propertyId: `P${number}`): WikidataClaimSource {
  const url = new URL(WIKIDATA_API);
  url.search = new URLSearchParams({
    action: "wbgetclaims",
    format: "json",
    entity: entityId,
    property: propertyId,
  }).toString();
  return {entityId, propertyId, apiUrl: url.toString()};
}

function historicalDateValue(
  entityId: WikidataId,
  propertyId: `P${number}`,
  value: unknown,
) {
  if (typeof value !== "object" || value === null) return null;
  const timeValue = value as TimeValue;
  if (!timeValue.time || typeof timeValue.precision !== "number") return null;

  const match = /^([+-])(\d+)-(\d{2})-(\d{2})T/.exec(timeValue.time);
  if (!match) return null;
  const yearMagnitude = Number(match[2]);
  const month = Number(match[3]);
  const day = Number(match[4]);

  return {
    year: match[1] === "-" ? -yearMagnitude : yearMagnitude,
    month: timeValue.precision >= 10 && month > 0 ? month : null,
    day: timeValue.precision >= 11 && day > 0 ? day : null,
    precision: timeValue.precision,
    calendarModel: timeValue.calendarmodel ?? null,
    source: claimSource(entityId, propertyId),
  } satisfies HistoricalDate;
}

function historicalDate(entityId: WikidataId, entity: WikibaseEntity, propertyId: `P${number}`) {
  return historicalDateValue(entityId, propertyId, statementValue(entity, propertyId));
}

function qualifierDate(
  entityId: WikidataId,
  propertyId: `P${number}`,
  statement: WikibaseStatement,
  qualifierPropertyId: `P${number}`,
) {
  const value = statement.qualifiers?.[qualifierPropertyId]?.find(
    (qualifier) => qualifier.snaktype === "value",
  )?.datavalue?.value;
  return historicalDateValue(entityId, propertyId, value);
}

function lifeEventsForProperty(
  philosopherId: WikidataId,
  entity: WikibaseEntity,
  propertyId: `P${number}`,
  kind: HistoricalLifeEvent["kind"],
) {
  return statements(entity, propertyId).flatMap((statement) => {
    const placeId = entityIdFromValue(statement.mainsnak?.datavalue?.value);
    if (!placeId) return [];

    return [{
      kind,
      placeId,
      startDate: qualifierDate(philosopherId, propertyId, statement, PROPERTIES.startTime),
      endDate: qualifierDate(philosopherId, propertyId, statement, PROPERTIES.endTime),
      source: claimSource(philosopherId, propertyId),
    } satisfies HistoricalLifeEvent];
  });
}

function coordinates(entityId: WikidataId, entity: WikibaseEntity) {
  const value = statementValue(entity, PROPERTIES.coordinates);
  if (typeof value !== "object" || value === null) return null;
  const coordinate = value as CoordinateValue;
  if (typeof coordinate.latitude !== "number" || typeof coordinate.longitude !== "number") return null;

  return {
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    precision: coordinate.precision ?? null,
    globe: coordinate.globe ?? null,
    source: claimSource(entityId, PROPERTIES.coordinates),
  } satisfies GeoCoordinates;
}

function stringClaim(entity: WikibaseEntity, propertyId: string) {
  const value = statementValue(entity, propertyId);
  return typeof value === "string" ? value : null;
}

function plainText(value: string | undefined) {
  if (!value) return null;
  const text = value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
  return text || null;
}

async function fetchCommonsImages(fileNames: readonly string[]) {
  const result = new Map<string, CommonsImage>();

  for (const fileBatch of chunks(fileNames, 10)) {
    const url = new URL(COMMONS_API);
    url.search = new URLSearchParams({
      action: "query",
      format: "json",
      formatversion: "2",
      prop: "imageinfo",
      titles: fileBatch.map((fileName) => `File:${fileName}`).join("|"),
      iiprop: "url|extmetadata",
      iiurlwidth: "800",
      iiextmetadatalanguage: "en",
      iiextmetadatafilter: "Artist|Credit|LicenseShortName|LicenseUrl",
    }).toString();

    const response = await fetchJson<CommonsResponse>(url);
    const pagesValue = response.query?.pages ?? [];
    const pages = Array.isArray(pagesValue) ? pagesValue : Object.values(pagesValue);

    for (const page of pages) {
      if (page.missing || !page.title?.startsWith("File:")) continue;
      const fileName = page.title.slice(5).replace(/_/g, " ");
      const info = page.imageinfo?.[0];
      if (!info) continue;
      const metadata = info.extmetadata ?? {};
      result.set(fileName, {
        fileName,
        originalUrl: info.url ?? null,
        thumbnailUrl: info.thumburl ?? null,
        descriptionUrl: info.descriptionurl ?? null,
        artist: plainText(metadata.Artist?.value),
        credit: plainText(metadata.Credit?.value),
        license: plainText(metadata.LicenseShortName?.value),
        licenseUrl: metadata.LicenseUrl?.value ?? null,
      });
    }
  }

  return result;
}

function emptyLocaleData(): LocaleData {
  return {philosophers: {}, places: {}, schools: {}, people: {}};
}

async function readExistingData(): Promise<GeneratedPhilosopherData | null> {
  try {
    const parsed = JSON.parse(await readFile(OUTPUT_PATH, "utf8")) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "schemaVersion" in parsed &&
      (parsed.schemaVersion === 2 || parsed.schemaVersion === 3)
    ) {
      return parsed as GeneratedPhilosopherData;
    }
  } catch (error) {
    const code = error instanceof Error && "code" in error ? error.code : null;
    if (code !== "ENOENT") throw error;
  }

  return null;
}

async function buildData(): Promise<GeneratedPhilosopherData> {
  const existingData = await readExistingData();
  const coreIds = CORE_PHILOSOPHERS.map(({id}) => id);
  console.log(`Discovering ${ADDITIONAL_PHILOSOPHER_COUNT} widely documented philosophers…`);
  const additionalIds = await discoverAdditionalPhilosophers(coreIds);
  const philosopherIds = [...coreIds, ...additionalIds];
  console.log(`Fetching ${philosopherIds.length} philosopher entities from Wikidata…`);
  const philosopherEntities = await fetchEntities(
    philosopherIds,
    "labels|descriptions|claims|sitelinks",
    "enwiki|trwiki",
  );

  for (const {id, expectedEnglishLabel} of CORE_PHILOSOPHERS) {
    const actualLabel = philosopherEntities.get(id)?.labels?.en?.value;
    if (actualLabel !== expectedEnglishLabel) {
      console.warn(
        `Entity label differs for ${id}: expected “${expectedEnglishLabel}”, received “${actualLabel ?? "missing label"}”`,
      );
    }
  }

  const placeIds = new Set<WikidataId>();
  const schoolIds = new Set<WikidataId>();
  const personIds = new Set<WikidataId>();
  const imageFileNames = new Set<string>();

  for (const id of philosopherIds) {
    const entity = philosopherEntities.get(id);
    if (!entity) throw new Error(`Wikidata omitted philosopher ${id}`);
    const birthPlaceId = entityIdFromValue(statementValue(entity, PROPERTIES.birthPlace));
    if (birthPlaceId) placeIds.add(birthPlaceId);
    for (const propertyId of [
      PROPERTIES.deathPlace,
      PROPERTIES.educatedAt,
      PROPERTIES.residence,
      PROPERTIES.workLocation,
    ]) {
      for (const placeId of entityIds(entity, propertyId)) placeIds.add(placeId);
    }
    for (const schoolId of entityIds(entity, PROPERTIES.school)) schoolIds.add(schoolId);
    for (const personId of entityIds(entity, PROPERTIES.influencedBy)) personIds.add(personId);
    const imageFileName = stringClaim(entity, PROPERTIES.image);
    if (imageFileName) imageFileNames.add(imageFileName);
  }

  const relatedIds = [...new Set([...placeIds, ...schoolIds])];
  console.log(`Fetching ${relatedIds.length} related place and school entities…`);
  const relatedEntities = await fetchEntities(relatedIds, "labels|claims");
  console.log(`Fetching labels for ${personIds.size} influence entities…`);
  const personEntities = await fetchEntities([...personIds], "labels");
  console.log(`Fetching metadata for ${imageFileNames.size} Wikimedia Commons images…`);
  const images = await fetchCommonsImages([...imageFileNames]);

  const localizations = {en: emptyLocaleData(), tr: emptyLocaleData()};
  const philosophers: NormalizedPhilosopher[] = [];

  for (const wikidataId of philosopherIds) {
    const entity = philosopherEntities.get(wikidataId);
    if (!entity) throw new Error(`Wikidata omitted philosopher ${wikidataId}`);
    const imageFileName = stringClaim(entity, PROPERTIES.image);
    const birthPlaceId = entityIdFromValue(statementValue(entity, PROPERTIES.birthPlace));
    const deathPlaceId = entityIdFromValue(statementValue(entity, PROPERTIES.deathPlace));
    const birthDate = historicalDate(wikidataId, entity, PROPERTIES.birthDate);
    const deathDate = historicalDate(wikidataId, entity, PROPERTIES.deathDate);
    const lifeEvents: HistoricalLifeEvent[] = [
      ...(birthPlaceId
        ? [{
            kind: "birth" as const,
            placeId: birthPlaceId,
            startDate: birthDate,
            endDate: null,
            source: claimSource(wikidataId, PROPERTIES.birthPlace),
          }]
        : []),
      ...lifeEventsForProperty(wikidataId, entity, PROPERTIES.educatedAt, "education"),
      ...lifeEventsForProperty(wikidataId, entity, PROPERTIES.residence, "residence"),
      ...lifeEventsForProperty(wikidataId, entity, PROPERTIES.workLocation, "work"),
      ...(deathPlaceId
        ? [{
            kind: "death" as const,
            placeId: deathPlaceId,
            startDate: deathDate,
            endDate: null,
            source: claimSource(wikidataId, PROPERTIES.deathPlace),
          }]
        : []),
    ];

    philosophers.push({
      wikidataId,
      birthDate,
      deathDate,
      birthPlaceId,
      schoolIds: [...new Set(entityIds(entity, PROPERTIES.school))],
      influencedByIds: [...new Set(entityIds(entity, PROPERTIES.influencedBy))],
      lifeEvents,
      image: imageFileName ? images.get(imageFileName.replace(/_/g, " ")) ?? null : null,
    });

    for (const locale of LOCALES) {
      const existing = existingData?.localizations[locale].philosophers[wikidataId];
      localizations[locale].philosophers[wikidataId] = {
        name: entity.labels?.[locale]?.value ?? null,
        summary: existing?.summary ?? null,
        wikidataDescription: entity.descriptions?.[locale]?.value ?? null,
        sourceSummary: existing?.sourceSummary ?? null,
        wikipediaTitle: entity.sitelinks?.[`${locale}wiki`]?.title ?? null,
      };
    }
  }

  const places: NormalizedPlace[] = [...placeIds].map((wikidataId) => {
    const entity = relatedEntities.get(wikidataId);
    if (!entity) throw new Error(`Wikidata omitted place ${wikidataId}`);
    for (const locale of LOCALES) {
      localizations[locale].places[wikidataId] = entity.labels?.[locale]?.value ?? null;
    }
    return {wikidataId, coordinates: coordinates(wikidataId, entity)};
  });

  const schools: NormalizedSchool[] = [...schoolIds].map((wikidataId) => {
    const entity = relatedEntities.get(wikidataId);
    if (!entity) throw new Error(`Wikidata omitted school ${wikidataId}`);
    for (const locale of LOCALES) {
      localizations[locale].schools[wikidataId] = entity.labels?.[locale]?.value ?? null;
    }
    return {wikidataId};
  });

  for (const wikidataId of personIds) {
    const entity = personEntities.get(wikidataId);
    if (!entity) throw new Error(`Wikidata omitted influence entity ${wikidataId}`);
    for (const locale of LOCALES) {
      localizations[locale].people[wikidataId] = entity.labels?.[locale]?.value ?? null;
    }
  }

  return {
    schemaVersion: 3,
    generatedAt: new Date().toISOString(),
    source: {
      wikidataApi: WIKIDATA_API,
      commonsApi: COMMONS_API,
      entityIds: philosopherIds,
      properties: PROPERTIES,
      userAgent: USER_AGENT,
    },
    philosophers,
    places,
    schools,
    localizations,
  };
}

async function main() {
  const data = await buildData();
  await mkdir(dirname(OUTPUT_PATH), {recursive: true});
  await writeFile(OUTPUT_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`Wrote ${data.philosophers.length} philosophers to ${OUTPUT_PATH}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`Wikidata fetch failed: ${message}`);
  process.exitCode = 1;
});
