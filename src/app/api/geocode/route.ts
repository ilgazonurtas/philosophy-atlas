import {NextRequest, NextResponse} from "next/server";
import type {GeocodingResult} from "@/types/map";

const NOMINATIM_SEARCH = "https://nominatim.openstreetmap.org/search";
const USER_AGENT =
  "PhiloAtlas/0.1 (https://github.com/ilgazonurtas/philosophy-atlas; place search)";
const MINIMUM_INTERVAL_MS = 1_100;
let earliestNextRequest = 0;

interface NominatimResult {
  place_id?: number;
  lat?: string;
  lon?: string;
  display_name?: string;
}

function sleep(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

async function respectUsageLimit() {
  const wait = Math.max(0, earliestNextRequest - Date.now());
  if (wait > 0) await sleep(wait);
  earliestNextRequest = Date.now() + MINIMUM_INTERVAL_MS;
}

function parseResult(result: NominatimResult): GeocodingResult | null {
  const latitude = Number(result.lat);
  const longitude = Number(result.lon);
  if (
    typeof result.place_id !== "number" ||
    typeof result.display_name !== "string" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return {id: String(result.place_id), latitude, longitude, label: result.display_name};
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const locale = request.nextUrl.searchParams.get("locale") === "tr" ? "tr" : "en";
  if (query.length < 2 || query.length > 120) {
    return NextResponse.json({error: "Invalid search query."}, {status: 400});
  }

  await respectUsageLimit();
  const url = new URL(NOMINATIM_SEARCH);
  url.search = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: "5",
    "accept-language": locale,
  }).toString();

  try {
    const response = await fetch(url, {
      headers: {Accept: "application/json", "User-Agent": USER_AGENT},
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) {
      return NextResponse.json({error: "Geocoding service unavailable."}, {status: 502});
    }

    const data = (await response.json()) as unknown;
    const results = Array.isArray(data)
      ? data.flatMap((item) => {
          if (typeof item !== "object" || item === null) return [];
          const parsed = parseResult(item as NominatimResult);
          return parsed ? [parsed] : [];
        })
      : [];
    return NextResponse.json({results});
  } catch {
    return NextResponse.json({error: "Geocoding service unavailable."}, {status: 502});
  }
}
