import { ArrowDown, ArrowRight } from 'lucide-react';
import { bodyOf, CATEGORY, getArticle, imageOf, stripTags } from '@/lib/joomla';
import { t, type Locale } from '@/lib/i18n';

export default async function Hero({ locale }: { locale: Locale }) {
  const hero = await getArticle('home-hero', locale, CATEGORY.uncategorised);
  if (!hero) return null;

  const bg = imageOf(hero);
  // bodyOf() memakai || — Joomla mengirim "" untuk field kosong, dan ?? akan menyimpannya.
  const subtitle = stripTags(bodyOf(hero));
  const ui = t(locale);

  return (
    // min-h-svh, not vh: on mobile Safari the address bar makes 100vh taller than the visible
    // viewport, which pushes the subtitle under the fold on first paint.
    <section id="top" className="relative isolate flex min-h-svh scroll-mt-20 items-center justify-center overflow-hidden bg-neutral-950 px-4 py-32 sm:px-6">
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

      <div className="mx-auto w-full max-w-6xl text-center text-white lg:text-left">
        <div className="max-w-4xl lg:max-w-3xl">
        {/* The two lines rise in sequence on load — animation, not scroll timeline, because
            they are already on screen when the page paints. */}
        <h1 className="animate-in fade-in slide-in-from-bottom-4 text-balance text-4xl font-semibold leading-[1.08] tracking-tight duration-700 sm:text-6xl lg:text-7xl motion-reduce:animate-none">
          {hero.attributes.title}
        </h1>
        {subtitle && (
          <p className="animate-in fade-in slide-in-from-bottom-4 mx-auto mt-6 max-w-2xl text-pretty text-lg text-white/80 delay-150 duration-700 fill-mode-backwards lg:mx-0 sm:text-xl motion-reduce:animate-none">
            {subtitle}
          </p>
        )}
          <div className="animate-in fade-in slide-in-from-bottom-4 mt-8 flex flex-wrap justify-center gap-3 delay-300 duration-700 fill-mode-backwards lg:justify-start motion-reduce:animate-none">
            <a href="#services" className="group inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition duration-300 ease-settle hover:bg-primary/90 hover:shadow-brand active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100">
              {ui.viewServices}
              <ArrowRight className="size-4 transition-transform duration-500 ease-settle group-hover:translate-x-1 motion-reduce:transition-none" />
            </a>
            <a href="#about" className="group inline-flex min-h-11 items-center gap-2 rounded-md border border-white/45 px-5 py-2.5 text-sm font-semibold text-white transition duration-300 ease-settle hover:border-white hover:bg-white/10 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100">
              {ui.exploreCompany}
              <ArrowDown className="size-4 transition-transform duration-500 ease-settle group-hover:translate-y-0.5 motion-reduce:transition-none" />
            </a>
          </div>
        </div>
      </div>

    </section>
  );
}
