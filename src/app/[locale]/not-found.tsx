import {getTranslations} from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("States");

  return (
    <main className="grid min-h-screen place-items-center bg-parchment px-6 text-center">
      <section>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-moss">404</p>
        <h1 className="mt-3 font-serif text-4xl font-bold">{t("notFound")}</h1>
      </section>
    </main>
  );
}
