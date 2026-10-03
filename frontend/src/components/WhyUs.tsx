import {
  bodyOf,
  CATEGORY,
  getArticle,
  getCategory,
  getHeading,
  stripTags,
} from '@/lib/joomla';
import { iconFrom } from '@/lib/icons';
import CornerSweep from '@/components/CornerSweep';
import type { Locale } from '@/lib/i18n';

/** Resolved from a Joomla value, so it can only be looked up at render. */
function Icon({ field, className }: { field: unknown; className?: string }) {
  const Glyph = iconFrom(field);
  // eslint-disable-next-line react-hooks/static-components
  return <Glyph className={className} strokeWidth={1.5} aria-hidden />;
}

/**
 * "Mengapa Cakra" — pitch on the left, vertically centered against the
 * numbered feature cards, framed by deck-style blue corner sweeps. No pills, no extra
 * chrome — the Joomla copy carries the section.
 * Copy, features, and icons all come from Joomla (category `about-features`
 * + headings); the 01–04 numerals are derived from list order, so editors
 * can add or remove features without touching code.
 */
export default async function WhyUs({ locale }: { locale: Locale }) {
  const [features, eyebrow, head] = await Promise.all([
    getCategory(CATEGORY.aboutFeatures, locale),
    getHeading('about-why-eyebrow', locale),
    getArticle('heading-about-why', locale, CATEGORY.headings),
  ]);
  if (features.length === 0) return null;

  const title = head?.attributes.title ?? '';
  const description = head ? stripTags(bodyOf(head)) : '';

  return (
    <section id="why" className="relative scroll-mt-20 overflow-hidden border-y border-border/60 bg-surface-container-low px-4 py-20 sm:px-6 lg:py-28">
      {/* Deck-style corner sweeps: solid brand wedges, no gradients. */}
      <CornerSweep className="right-0 top-0" />
      <CornerSweep className="bottom-0 left-0 rotate-180" />
      <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14">
        {/* Vertically centered against the card grid, like the reference. */}
        <div className="reveal">
          {eyebrow && (
            <p className="flex items-center gap-3 text-base font-bold uppercase tracking-[0.18em] text-primary">
              <span aria-hidden className="block h-1 w-12 rounded-full bg-primary" />
              {eyebrow}
            </p>
          )}
          {title && (
            <h2 className="mt-4 max-w-2xl text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
              {title}
            </h2>
          )}
          {description && (
            <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              {description}
            </p>
          )}
        </div>

        {/* Numbered cards on a plain backdrop: icon, title, description.
            Numerals are derived from list order; the stagger comes from the
            shared CSS scroll-timeline cascade — no client JS involved. */}
        <ul className="reveal-stagger grid gap-4 sm:grid-cols-2 sm:gap-5">
          {features.map((f, i) => (
            <li
              key={f.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 text-left transition-all duration-300 ease-exit hover:-translate-y-1 hover:border-primary/40 hover:shadow-brand motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent text-primary transition-colors duration-300 ease-exit group-hover:bg-primary group-hover:text-primary-foreground motion-reduce:transition-none">
                  <Icon field={f.attributes.icon} className="size-6" />
                </span>
                {/* Derived from order, not content: safe in all three locales. */}
                <span aria-hidden className="font-heading text-sm font-bold tabular-nums tracking-widest text-muted-foreground/50 transition-colors duration-300 ease-exit group-hover:text-primary motion-reduce:transition-none">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="mt-5 text-balance text-lg font-bold leading-snug">
                {f.attributes.title}
              </h3>
              {/* No clamp: the old line-clamp-2 silently ate Joomla copy. */}
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {stripTags(bodyOf(f))}
              </p>
              {/* Stripe-style affordance: the card "underlines" itself. */}
              <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-primary transition-transform duration-500 ease-settle group-hover:scale-x-100 motion-reduce:transition-none" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
