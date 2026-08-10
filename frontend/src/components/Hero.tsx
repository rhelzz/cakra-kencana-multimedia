import { getArticle, imageOf, stripTags } from '@/lib/joomla';
import type { Locale } from '@/lib/i18n';

export default async function Hero({ locale }: { locale: Locale }) {
  const hero = await getArticle('home-hero', locale);
  if (!hero) return null;

  const { title, text, articletext, introtext } = hero.attributes;
  const bg = imageOf(hero);
  const subtitle = stripTags(text ?? articletext ?? introtext);

  return (
    <section id="top" className="relative isolate flex min-h-[92svh] items-center justify-center overflow-hidden bg-neutral-950 px-4 py-32 text-center sm:px-6">
      {bg && (
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: `url("${bg}")` }}
          role="presentation"
        />
      )}
      {/* Darker at the top so the floating header stays readable, softer over the copy. */}
      <div className="absolute inset-0 -z-10 bg-linear-to-b from-black/75 via-black/55 to-black/70" />

      <div className="mx-auto max-w-4xl text-white">
        <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-white/80 sm:text-xl">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
