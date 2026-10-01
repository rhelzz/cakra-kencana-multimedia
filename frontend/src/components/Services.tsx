import { CATEGORY, getCategory, getHeading } from '@/lib/joomla';
import ServiceTile from '@/components/ServiceTile';
import type { Locale } from '@/lib/i18n';

export default async function Services({ locale }: { locale: Locale }) {
  const [services, eyebrow, heading, subtitle] = await Promise.all([
    getCategory(CATEGORY.services, locale),
    getHeading('services-eyebrow', locale),
    getHeading('services', locale),
    getHeading('services-subtitle', locale),
  ]);
  if (services.length === 0) return null;

  return (
    // scroll-mt matches the solid navbar height (h-20), so an anchor click parks the heading
    // just below the bar instead of under it.
    <section id="services" className="scroll-mt-20 bg-background px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="reveal">
          {eyebrow && (
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <span aria-hidden className="block h-[3px] w-8 rounded-full bg-primary" />
              {eyebrow}
            </p>
          )}
          <h2 className="mt-4 max-w-2xl text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            {heading}
          </h2>
          {subtitle && (
            <p className="mt-3 text-base text-muted-foreground sm:text-lg">{subtitle}</p>
          )}
        </div>

        <ul className="reveal-stagger mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:mt-12 lg:grid-cols-4 lg:gap-5">
          {services.map((s) => (
            <ServiceTile key={s.id} service={s} />
          ))}
        </ul>
      </div>
    </section>
  );
}
