import type {Metadata} from "next";
import {hasLocale} from "next-intl";
import {getTranslations, setRequestLocale} from "next-intl/server";
import {AtlasClient} from "@/components/atlas-client";
import {routing} from "@/i18n/routing";
import {getPhilosophers} from "@/lib/philosophers";

export async function generateMetadata({params}: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: "Metadata"});

  return {title: t("title"), description: t("description")};
}

export default async function AtlasPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const appLocale = hasLocale(routing.locales, locale) ? locale : routing.defaultLocale;
  const philosophers = await getPhilosophers(appLocale);

  return <AtlasClient philosophers={philosophers} />;
}
