import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CATEGORY, getCategory, getHeading } from '@/lib/joomla';
import ServiceTile from '@/components/ServiceTile';
import { localePath, t, type Locale } from '@/lib/i18n';

/** Home shows a teaser slice; the full list lives on /services. */
const VISIBLE_COUNT = 4;

export default async function Services({ locale }: { locale: Locale }) {
  const [services, eyebrow, heading, subtitle] = await Promise.all([
    getCategory(CATEGORY.services, locale),
    getHeading('services-eyebrow', locale),
    getHeading('services', locale),
    getHeading('services-subtitle', locale),
  ]);
  if (services.length === 0) return null;

  const ui = t(locale);
  const base = localePath(locale) === '/' ? '' : localePath(locale);
  const showAll = services.length > VISIBLE_COUNT;

  return (
    // scroll-mt matches the solid navbar height (h-20), so an anchor click parks the heading
    // just below the bar instead of under it.
    <section id="services" className="scroll-mt-20 bg-background px-4 py-16 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-6xl">
        {/* Split header: pitch on the left, supporting copy + explore link
            on the right. The right column only renders when it has content. */}
        <div className="grid gap-6 lg:grid-cols-2 lg:items-end lg:gap-12">
          <div className="reveal">
            {eyebrow && (
              <p className="flex items-center gap-3 text-base font-bold uppercase tracking-[0.18em] text-primary">
                <span aria-hidden className="block h-1 w-12 rounded-full bg-primary" />
                {eyebrow}
              </p>
            )}
            <h2 className="mt-4 max-w-2xl text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
              {heading}
            </h2>
          </div>
          {(subtitle || showAll) && (
            <div className="reveal lg:justify-self-end">
              {subtitle && (
                <p className="max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
                  {subtitle}
                </p>
              )}
              {showAll && (
                <Link
                  href={`${base}/services`}
                  className="group mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
                >
                  {ui.viewAllServices.replace('{count}', String(services.length))}
                  <ArrowRight className="size-4 transition-transform duration-300 ease-settle group-hover:translate-x-1 motion-reduce:transition-none" />
                </Link>
              )}
            </div>
          )}
        </div>

        <ul className="reveal-stagger mt-8 grid gap-4 sm:grid-cols-2 sm:gap-4 lg:mt-10 lg:grid-cols-4 lg:gap-5">
          {services.slice(0, VISIBLE_COUNT).map((s) => (
            <ServiceTile
              key={s.id}
              service={s}
              base={base}
              learnMore={ui.learnMore}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
