import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import {
  bodyOf,
  CATEGORY,
  getArticle,
  getHeading,
  imageOf,
  stripTags,
} from '@/lib/joomla';
import { localePath, t, type Locale } from '@/lib/i18n';

/**
 * "Wilayah Kami" — the Indonesia map is the section *background* (full-bleed,
 * dissolving into the band on the left), with pitch + outline CTA on top-left.
 * The file lives on the coverage heading article (`image_intro`); without it
 * the band simply renders clean.
 */
export default async function Coverage({ locale }: { locale: Locale }) {
  const [eyebrow, head] = await Promise.all([
    getHeading('about-coverage-eyebrow', locale),
    getArticle('heading-about-coverage', locale, CATEGORY.headings),
  ]);
  if (!head) return null;

  const title = head?.attributes.title ?? '';
  const description = head ? stripTags(bodyOf(head)) : '';
  const mapSrc = head ? imageOf(head) : undefined;
  const ui = t(locale);
  const base = localePath(locale) === '/' ? '' : localePath(locale);

  return (
    <section
      id="coverage"
      className="relative isolate scroll-mt-20 overflow-hidden border-t border-border bg-surface-container-low px-4 py-20 sm:px-6 lg:py-28"
    >
      {mapSrc && (
        <div
          aria-hidden
          // Plain .coverage-map class (see globals.css): 112% wide, pinned
          // left, so the map runs off past the right edge with no gap.
          className="coverage-map -z-10 opacity-15 lg:opacity-35 dark:opacity-10 dark:brightness-[.85] lg:dark:opacity-20"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mapSrc} alt="" loading="lazy" />
        </div>
      )}

      <div className="mx-auto max-w-6xl">
        <div className="reveal max-w-xl">
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
          <Link
            href={`${base}/offices`}
            className="mt-8 inline-flex items-center gap-2 rounded-md border border-primary/40 px-5 py-3 text-sm font-medium text-primary transition duration-300 ease-exit hover:border-primary hover:bg-accent motion-reduce:transition-none"
          >
            {ui.coverageCta}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
