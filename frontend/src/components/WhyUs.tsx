import {
  bodyOf,
  CATEGORY,
  getArticle,
  getCategory,
  getHeading,
  stripTags,
} from '@/lib/joomla';
import { iconFrom } from '@/lib/icons';
import type { Locale } from '@/lib/i18n';

/** Resolved from a Joomla value, so it can only be looked up at render. */
function Icon({ field, className }: { field: unknown; className?: string }) {
  const Glyph = iconFrom(field);
  // eslint-disable-next-line react-hooks/static-components
  return <Glyph className={className} strokeWidth={1.5} aria-hidden />;
}

/**
 * "Mengapa Cakra" — pitch on the left, 2×2 feature grid on the right.
 * Copy, features, and icons all come from Joomla (category `about-features`
 * + headings); only the CTA label is interface chrome.
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
    <section id="why" className="scroll-mt-20 border-y border-border/60 bg-surface-container-low px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center lg:gap-14">
        <div className="reveal">
          {eyebrow && (
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <span aria-hidden className="block h-[3px] w-8 rounded-full bg-primary" />
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

        {/* One container, four cells: hairline dividers come from the gap
            showing the bordered background through, no per-cell borders. */}
        <ul className="reveal grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
          {features.map((f) => (
            <li
              key={f.id}
              className="group flex flex-col items-center bg-card p-6 text-center"
            >
              <span className="grid size-12 place-items-center rounded-full bg-accent text-primary transition-transform duration-500 ease-settle group-hover:scale-110 motion-reduce:transition-none">
                <Icon field={f.attributes.icon} className="size-6" />
              </span>
              <h3 className="mt-5 text-base font-bold leading-snug">
                {f.attributes.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {stripTags(bodyOf(f))}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
