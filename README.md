# Philo Atlas

Philo Atlas is a full-screen, bilingual map for exploring where and when major philosophers lived. This version uses a local dataset of 31 thinkers, including a broad Ancient Greek collection, and intentionally has no database or API layer.

## Features

- Next.js App Router with strict TypeScript
- Responsive React Leaflet world map
- Timeline filtering with BCE years stored as negative integers
- Keyboard-enabled philosopher markers and responsive detail panels
- English and Turkish routes powered by `next-intl`
- Local JSON data with runtime shape validation
- Local SVG portrait assets
- Route-level loading, error, empty and not-found states
- Tailwind CSS styling
- Client-only Leaflet boundary for server-rendering compatibility

## Requirements

- Node.js 20.19+ LTS or 22.13+ LTS
- npm 10 or newer

## Setup

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The locale middleware redirects the root route to `/en`; Turkish is available at `/tr`.

## Production build

```bash
npm run typecheck
npm run lint
npm run build
npm start
```

## Project structure

```text
messages/                    English and Turkish interface copy
public/portraits/            Local mock portrait illustrations
src/app/[locale]/            Localized App Router routes and route states
src/components/              Map, panel, timeline and language controls
src/data/philosophers.json   Local philosopher dataset
src/i18n/                    next-intl routing and request configuration
src/lib/                     Data validation and year formatting
src/types/                   Shared TypeScript models
```

## Philosopher data

Every entry in `src/data/philosophers.json` contains:

```ts
{
  id: string;
  name: string;
  birthYear: number;       // BCE is negative, e.g. -470
  deathYear: number;
  birthPlace: {en: string; tr: string};
  latitude: number;
  longitude: number;
  imageUrl: string;
  school: {en: string; tr: string};
  summary: {en: string; tr: string};
  influencedBy: string[];
  sources: Array<{title: string; url: string}>;
}
```

The start and end years are inclusive: a philosopher is visible when `birthYear <= selectedYear <= deathYear`.

## Map tiles

The application uses CARTO's light basemap with OpenStreetMap data. Browser access to the tile hosts is required when running the app. Review the providers' usage policies before deploying at significant scale.

## Next steps

The local data access is isolated in `src/lib/philosophers.ts`, so a future database or API can replace it without changing the map and panel component contracts.
