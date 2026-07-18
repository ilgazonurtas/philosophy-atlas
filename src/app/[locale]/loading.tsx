import {getTranslations} from "next-intl/server";

export default async function Loading() {
  const t = await getTranslations("States");

  return (
    <main className="grid min-h-screen place-items-center bg-parchment" aria-busy="true">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-moss/20 border-t-moss" />
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-moss">{t("loading")}</p>
      </div>
    </main>
  );
}
