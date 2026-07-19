import type {AppLocale} from "@/i18n/routing";

type Era = "bce" | "ce";
type EraFormatter = (era: Era, values: {year: string}) => string;

export function formatYear(year: number, _locale: AppLocale, formatEra: EraFormatter) {
  const era = year < 0 ? "bce" : "ce";

  return formatEra(era, {year: String(Math.abs(year))});
}
