import { bodyOf, CATEGORY, getArticle, imageOf, stripTags } from '@/lib/joomla';
import type { Locale } from '@/lib/i18n';

export default async function Hero({ locale }: { locale: Locale }) {
  const hero = await getArticle('home-hero', locale, CATEGORY.uncategorised);
  if (!hero) return null;

  const bg = imageOf(hero);
  // bodyOf() memakai || — Joomla mengirim "" untuk field kosong, dan ?? akan menyimpannya.
  const subtitle = stripTags(bodyOf(hero));

  return (
    // min-h-svh, not vh: on mobile Safari the address bar makes 100vh taller than the visible
    // viewport, which pushes the subtitle under the fold on first paint.
    <section id="top" className="relative isolate flex min-h-[92svh] scroll-mt-20 items-center justify-center overflow-hidden bg-neutral-950 px-4 py-32 text-center sm:px-6">
      {bg && (
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: `url("${bg}")` }}
          role="presentation"
        />
      )}
      {/* Darker at the top so the floating header stays readable, softer over the copy. */}
      <div className="absolute inset-0 -z-10 bg-linear-to-b from-black/75 via-black/55 to-black/70" />
      {/* A brand-red wash rising from the bottom edge: it warms the photo, keeps the accent
          present above the fold, and stops the hero reading as a plain grey stock image. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-linear-to-t from-primary/20 via-primary/5 to-transparent"
      />

      <div className="mx-auto max-w-4xl text-white">
        {/* The two lines rise in sequence on load — animation, not scroll timeline, because
            they are already on screen when the page paints. */}
        <h1 className="animate-in fade-in slide-in-from-bottom-4 text-balance text-4xl font-semibold leading-[1.08] tracking-tight duration-700 sm:text-6xl lg:text-7xl motion-reduce:animate-none">
          {hero.attributes.title}
        </h1>
        {subtitle && (
          <p className="animate-in fade-in slide-in-from-bottom-4 mx-auto mt-6 max-w-2xl text-pretty text-lg text-white/80 delay-150 duration-700 fill-mode-backwards sm:text-xl motion-reduce:animate-none">
            {subtitle}
          </p>
        )}
      </div>

      {/* Scroll cue: the hero fills the screen, so without it there is nothing telling a
          first-time visitor that the page continues. */}
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-8 mx-auto h-10 w-px overflow-hidden bg-white/25"
      >
        <span className="block h-4 w-px animate-[scroll-cue_2.2s_ease-in-out_infinite] bg-white motion-reduce:animate-none" />
      </span>
    </section>
  );
}
