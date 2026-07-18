import philosopherData from "@/data/philosophers.json";
import type {Philosopher} from "@/types/philosopher";

function isLocalizedText(value: unknown): value is {en: string; tr: string} {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.en === "string" && typeof candidate.tr === "string";
}

function isPhilosopher(value: unknown): value is Philosopher {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;

  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    Number.isInteger(item.birthYear) &&
    Number.isInteger(item.deathYear) &&
    isLocalizedText(item.birthPlace) &&
    typeof item.latitude === "number" &&
    typeof item.longitude === "number" &&
    typeof item.imageUrl === "string" &&
    isLocalizedText(item.school) &&
    isLocalizedText(item.summary) &&
    Array.isArray(item.influencedBy) &&
    item.influencedBy.every((name) => typeof name === "string") &&
    Array.isArray(item.sources) &&
    item.sources.every(
      (source) =>
        typeof source === "object" &&
        source !== null &&
        typeof (source as Record<string, unknown>).title === "string" &&
        typeof (source as Record<string, unknown>).url === "string",
    )
  );
}

export function getPhilosophers(): Philosopher[] {
  if (!Array.isArray(philosopherData) || !philosopherData.every(isPhilosopher)) {
    throw new Error("The local philosopher dataset is invalid.");
  }

  return philosopherData;
}
