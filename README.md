# Philo Atlas

Philo Atlas is a full-screen, bilingual map for exploring where and when philosophers lived, worked, studied and died. It ships with a generated local snapshot of 231 philosophy-focused records and can optionally read the same normalized domain model from Supabase.

The atlas is designed as a visual research aid: dates and coordinates are factual claims retained with Wikidata sources, while names, labels and summaries are localized for English and Turkish.

## Features

- Next.js App Router with strict TypeScript
- Responsive, client-only React Leaflet world map
- Timeline filtering with BCE years stored as negative integers
- Keyboard-enabled markers and responsive detail panels
- Clickable influence relationships between atlas profiles
- Toggleable personal journey overlays on the main map for sourced birth, education, residence, work and death locations
- Nearby philosopher discovery from explicit browser geolocation or submitted place search
- English and Turkish routes powered by `next-intl`
- Normalized factual data separated from localized text
- Sourced Wikipedia introductions imported through official MediaWiki APIs
- Wikimedia Commons images with creator and license metadata
- Optional server-only Supabase data access with a local JSON fallback
- Loading, error, empty and not-found states

## Screenshots and interface guide

The interface is organized around four connected views:

1. **World map and timeline** — Each visible marker represents a philosopher alive during the selected year. Drag the timeline to move through BCE and CE history; the count and markers update together.
2. **Philosopher profile** — Select a marker to open the responsive profile panel. It contains dates, birth place, a source-backed summary, school or movement tags, influence links and citations.
3. **Nearby explorer** — Choose **Explore nearby** to search for a place or use the browser’s explicit location permission. Results are calculated from sourced life-event coordinates and can be narrowed by radius.
4. **Life journey overlay** — **Show journey on map** adds sourced birth, education, residence, work and death points to the main map. Checkboxes control event types; connecting lines indicate sequence, not an asserted travel route.

The supplied examples illustrate the English profile view, nearby search, journey overlay, scrollable influence lists, and Turkish localization.

### Turkish language support

Use the language switch in the upper-right corner or open [`/tr`](http://localhost:3000/tr) directly. The Turkish route translates interface labels, timeline era names (`MÖ` / `MS`), philosopher names where a Turkish label exists, place names, summaries imported from Turkish MediaWiki pages, school labels and nearby-search results. Factual years remain numeric BCE/CE values internally, so switching language does not change historical filtering.

The attached design examples should be committed under `docs/screenshots/` with these names:

```text
01-profile-en.png
02-nearby-search.png
03-life-journey.png
04-influences.png
05-profile-tr.png
```

Capture them from `npm run dev`; do not commit `.next` cache images.

## Requirements

- Node.js 20.19+ LTS or 22.13+ LTS
- npm 10 or newer

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The locale proxy redirects `/` to `/en`; Turkish is available at `/tr`.

Copy `.env.example` to `.env.local` if you want explicit configuration. The checked-in default uses local JSON, so no credentials are required for development.

## Verification and production

```bash
npm run typecheck
npm run lint
npm run build
npm start
```

## Project structure

```text
data/                                  Generated normalized data snapshot
messages/                              English and Turkish interface copy
scripts/fetch-wikidata.ts              Wikidata and Commons generator
scripts/fetch-wikipedia-summaries.ts   MediaWiki introduction importer
supabase/migrations/                    PostgreSQL schema migrations
src/app/[locale]/                       Localized App Router routes
src/components/                         Map, panel, timeline and language controls
src/lib/                                Local and Supabase data adapters
src/types/                              Domain and database types
```

## Philosopher data

Refresh the local snapshot through official APIs:

```bash
npm run data:fetch
npm run data:fetch-summaries
```

Run the commands in that order. The importer keeps a small core seed list and discovers 200 additional human entities explicitly classified as philosophers in Wikidata. Known non-philosophy records are excluded when their philosophical contribution is not substantial enough for this atlas.

The normalized snapshot separates facts from localized content:

```ts
{
  philosophers: NormalizedPhilosopher[];
  places: NormalizedPlace[];
  schools: NormalizedSchool[];
  localizations: {
    en: LocaleData;
    tr: LocaleData;
  };
}
```

Facts reference Wikidata claims, and coordinates remain attached to places. Influence relationships use Wikidata property `P737`; life events use sourced birth, death, education, residence and work-location statements. Names, summaries, Wikipedia titles, place labels and school labels live in locale tables. Missing values stay `null`; BCE years are negative integers.

`summary` is reserved for manually reviewed editorial copy. The MediaWiki importer never changes it and writes imported text only to `sourceSummary`, together with the original page URL, retrieval timestamp and language. A Wikidata refresh preserves both fields in an existing schema-version-3 snapshot. Rendering uses this order: reviewed `summary`, cleaned source introduction, then the short `wikidataDescription`, and presents a consistent maximum of three sentences. Pronunciation-heavy parenthetical lead text is removed from the display while the original source remains available through profile citations.

Both importers rate-limit requests, retry rate limits and server failures with exponential backoff, time out stalled calls, and send descriptive `User-Agent` headers. Commons metadata uses `imageinfo`; Wikipedia introductions use plain-text introductory extracts from `prop=extracts|info`. No HTML page is scraped.

The timeline range is inclusive: a philosopher appears when `birthYear <= selectedYear <= deathYear`.

## Nearby place search

The nearby explorer compares a chosen coordinate with all sourced philosopher life events using great-circle distance. Browser geolocation is requested only after the user presses the location button and is not sent to the application server. Place searches use the server route at `src/app/api/geocode/route.ts`, which submits a single, user-initiated request to OpenStreetMap Nominatim, identifies the application, spaces requests at least 1.1 seconds apart per server process, and does not implement autocomplete. Search attribution and a privacy explanation are shown in the interface.

The public Nominatim service has strict capacity limits and may withdraw access. Configure a self-hosted or commercial geocoder before substantial production traffic. See the [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/) and [search API documentation](https://nominatim.org/release-docs/latest/api/Search/).

## Supabase

The migration at `supabase/migrations/202607190001_create_philosophy_schema.sql` creates:

- `philosophers` and `philosopher_translations`
- `places`, `place_translations` and `philosopher_locations`
- `influences`, `sources` and `images`

Historical claims include source foreign keys and confidence values constrained from `0` to `1`. Images retain creator, credit, license and source metadata. Row-level security permits public reads but defines no public write policies.

Apply the migration to a linked project with the Supabase CLI:

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Then configure `.env.local`:

```dotenv
PHILOSOPHER_DATA_SOURCE=supabase
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Do not use a Supabase secret or service-role key here. The database adapter runs in Server Components. If Supabase loading fails during development, the app warns and falls back to local JSON; production surfaces the failure instead of silently serving stale data. Set `PHILOSOPHER_DATA_SOURCE=local` to force the snapshot in any environment.

The migration creates the schema but does not seed it. Keep local mode enabled until Supabase contains normalized rows.

## Map tiles

The application uses CARTO's light basemap with OpenStreetMap data. Browser access to the tile hosts is required. Review the providers' usage policies before deploying at significant scale.
