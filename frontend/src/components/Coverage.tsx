import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import {
  bodyOf,
  CATEGORY,
  getArticle,
  getHeading,
  stripTags,
} from '@/lib/joomla';
import { localePath, t, type Locale } from '@/lib/i18n';

/** Local cut-out map (transparent background), served from `public/`. */
const MAP_SRC = '/images/indonesia-map.png';

/**
 * "Wilayah Kami" — the Indonesia map is the section *background*, parked on
 * the right at reduced size so it never sits behind the pitch text. The left
 * edge dissolves with a mask so it melts into the band.
 */
export default async function Coverage({ locale }: { locale: Locale }) {
  const [eyebrow, head] = await Promise.all([
    getHeading('about-coverage-eyebrow', locale),
    getArticle('heading-about-coverage', locale, CATEGORY.headings),
  ]);
  if (!head) return null;

  const title = head?.attributes.title ?? '';
  const description = head ? stripTags(bodyOf(head)) : '';
  const ui = t(locale);
  const base = localePath(locale) === '/' ? '' : localePath(locale);

  return (
    <section
      id="coverage"
      className="relative isolate scroll-mt-20 overflow-hidden border-t border-border bg-surface-container-low px-4 py-20 sm:px-6 lg:py-28"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 -z-10 flex h-[42%] w-full items-center justify-end sm:inset-y-0 sm:h-auto sm:w-3/4 lg:w-3/5"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={MAP_SRC}
          alt=""
          loading="lazy"
          className="h-full w-full object-contain object-right opacity-50 [mask-image:linear-gradient(to_right,transparent_0%,black_30%)] sm:opacity-70 dark:opacity-40 dark:brightness-[.85]"
        />
      </div>

      <div className="mx-auto max-w-6xl">
        <div className="reveal max-w-xl">
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
