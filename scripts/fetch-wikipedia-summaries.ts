import {readFile, writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import type {AppLocale} from "../src/i18n/routing";
import type {GeneratedPhilosopherData, SourceSummary} from "../src/types/philosopher";

const OUTPUT_PATH = resolve(process.cwd(), "data", "philosophers.generated.json");
const USER_AGENT =
  "PhiloAtlasSummaryImporter/1.0 (https://github.com/ilgazonurtas/philosophy-atlas; Wikipedia introduction import)";
const LOCALES = ["en", "tr"] as const satisfies readonly AppLocale[];
const REQUEST_INTERVAL_MS = 350;
const MAX_RETRIES = 4;

interface MediaWikiPage {
  missing?: boolean;
  extract?: string;
  fullurl?: string;
}

interface MediaWikiResponse {
  query?: {pages?: MediaWikiPage[]};
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
    if (Number.isFinite(seconds)) return seconds * 1_000;

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

  throw new Error(
    `Request failed after ${MAX_RETRIES + 1} attempts: ${lastError?.message ?? "unknown error"}`,
  );
}

function parseData(value: unknown): GeneratedPhilosopherData {
  if (
    typeof value !== "object" ||
    value === null ||
    !("schemaVersion" in value) ||
    value.schemaVersion !== 3
  ) {
    throw new Error("Run `npm run data:fetch` before importing Wikipedia summaries.");
  }

  return value as GeneratedPhilosopherData;
}

async function fetchIntroduction(
  locale: AppLocale,
  title: string,
  retrievedAt: string,
): Promise<SourceSummary | null> {
  const url = new URL(`https://${locale}.wikipedia.org/w/api.php`);
  url.search = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    prop: "extracts|info",
    titles: title,
    redirects: "1",
    exintro: "1",
    explaintext: "1",
    inprop: "url",
  }).toString();

  const response = await fetchJson<MediaWikiResponse>(url);
  const page = response.query?.pages?.[0];
  const text = page?.extract?.trim();
  if (!page || page.missing || !text || !page.fullurl) return null;

  return {text, sourceUrl: page.fullurl, retrievedAt, language: locale};
}

async function main() {
  const data = parseData(JSON.parse(await readFile(OUTPUT_PATH, "utf8")) as unknown);
  const retrievedAt = new Date().toISOString();
  let imported = 0;

  for (const locale of LOCALES) {
    for (const philosopher of data.philosophers) {
      const translation = data.localizations[locale].philosophers[philosopher.wikidataId];
      if (!translation?.wikipediaTitle) continue;

      console.log(`Fetching ${locale} introduction for ${translation.wikipediaTitle}...`);
      translation.sourceSummary = await fetchIntroduction(
        locale,
        translation.wikipediaTitle,
        retrievedAt,
      );
      if (translation.sourceSummary) imported += 1;
    }
  }

  await writeFile(OUTPUT_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`Imported ${imported} sourced introductions without changing manual summaries.`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`Wikipedia summary import failed: ${message}`);
  process.exitCode = 1;
});
