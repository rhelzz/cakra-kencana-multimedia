import { bodyOf, CATEGORY, getArticle, getSiteName, imageOf, stripTags } from '@/lib/joomla';
import type { Locale } from '@/lib/i18n';

export default async function Hero({ locale }: { locale: Locale }) {
  const [hero, siteName] = await Promise.all([
    getArticle('home-hero', locale, CATEGORY.uncategorised),
    getSiteName(),
  ]);
  if (!hero) return null;

  const bg = imageOf(hero);
  // bodyOf() memakai || — Joomla mengirim "" untuk field kosong, dan ?? akan menyimpannya.
  const subtitle = stripTags(bodyOf(hero));

  // The headline is one Joomla title; the editor also fills `hero-accent` with the phrase
  // that gets the brand colour, so the split stays content-driven instead of guessed here.
  const full = hero.attributes.title;
  const accent = (hero.attributes['hero-accent'] as string | undefined) ?? '';
  const at = accent && full.includes(accent) ? full.indexOf(accent) : -1;
  const lead = at >= 0 ? full.slice(0, at) : full;
  const tail = at >= 0 ? full.slice(at) : '';

  return (
    // Full-bleed hero: photo covers the whole section, copy sits on a gradient
    // scrim (solid background at the left → transparent at ~65%) so there is no
    // interior box edge and the fade always ends at 0% opacity. min-h-svh keeps
    // the fold full-height.
    <section id="top" className="relative isolate flex min-h-svh scroll-mt-20 items-center overflow-hidden bg-background px-4 pb-16 pt-32 sm:px-6 md:pb-20">
      {bg && (
        <div
          className="absolute inset-0 -z-20 w-full bg-cover bg-center lg:bg-[position:70%_center]"
          style={{ backgroundImage: `url("${bg}")` }}
          role="presentation"
        />
      )}
      {/* Scrim, not a mask: solid background behind the copy fading to transparent
          over the photo. No mask-image means no cut-off line; no backdrop-blur
          means no expensive fullscreen filter. Tokens follow light/dark mode.
          Mobile stacks copy over photo, so the scrim runs top-to-bottom there. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-background/70 to-background/40 lg:bg-gradient-to-r lg:from-background lg:via-background/85 lg:via-[28%] lg:to-transparent lg:to-[65%]"
      />
      {/* Bottom blend into the next section: eased 8-stop feather (.hero-blend-bottom)
          over ~2x bottom padding, so the building base stays visible and the
          falloff slows into transparency with no band. */}
      <div
        aria-hidden
        className="hero-blend-bottom absolute inset-x-0 bottom-0 -z-10 h-32 md:h-40"
      />

      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-2xl">
          {/* The three lines rise in sequence on load — animation, not scroll timeline,
              because they are already on screen when the page paints. */}
          {siteName && (
            <p className="animate-in fade-in slide-in-from-bottom-4 text-sm font-bold uppercase tracking-[0.16em] text-foreground duration-700 motion-reduce:animate-none">
              {siteName}
            </p>
          )}
          <h1 className="animate-in fade-in slide-in-from-bottom-4 mt-6 text-balance text-5xl font-bold leading-[1.05] tracking-tight text-foreground duration-700 delay-150 fill-mode-backwards sm:text-6xl lg:text-7xl motion-reduce:animate-none">
            {lead}
            {tail && <span className="text-primary">{tail}</span>}
          </h1>
          {subtitle && (
            <p className="animate-in fade-in slide-in-from-bottom-4 mt-7 max-w-xl text-pretty text-lg text-muted-foreground delay-300 duration-700 fill-mode-backwards sm:text-xl motion-reduce:animate-none">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
