import type {AppLocale} from "@/i18n/routing";

type Era = "bce" | "ce";
type EraFormatter = (era: Era, values: {year: string}) => string;

export function formatYear(year: number, locale: AppLocale, formatEra: EraFormatter) {
  const formatter = new Intl.NumberFormat(locale);
  const era = year < 0 ? "bce" : "ce";

  return formatEra(era, {year: formatter.format(Math.abs(year))});
}
