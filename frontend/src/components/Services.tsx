import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CATEGORY, getCategory, getHeading } from '@/lib/joomla';
import ServiceCard from '@/components/ServiceCard';
import { localePath, t, type Locale } from '@/lib/i18n';

export default async function Services({ locale }: { locale: Locale }) {
  const [services, heading] = await Promise.all([
    getCategory(CATEGORY.services, locale),
    getHeading('services', locale),
  ]);
  if (services.length === 0) return null;
  const base = localePath(locale) === '/' ? '' : localePath(locale);
  const shown = services.slice(0, 6);

  return (
    // scroll-mt matches the solid navbar height (h-20), so an anchor click parks the heading
    // just below the bar instead of under it.
    <section id="services" className="scroll-mt-20 border-t border-border bg-muted/30 px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <h2 className="reveal max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {heading}
        </h2>
        <span aria-hidden className="reveal mt-5 block h-1 w-14 rounded-full bg-primary" />

        <ul className="reveal-stagger mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((s) => (
            <ServiceCard key={s.id} service={s} base={base} locale={locale} />
          ))}
        </ul>

        {services.length > 6 && (
          <div className="reveal mt-12 text-center">
            <Link
              href={`${base}/services`}
              className="group inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium transition duration-300 ease-settle hover:border-primary/50 hover:bg-accent hover:text-accent-foreground active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
            >
              {t(locale).moreServices}
              <ArrowRight className="size-3.5 transition-transform duration-500 ease-settle group-hover:translate-x-1 motion-reduce:transition-none" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
