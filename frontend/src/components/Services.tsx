import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { bodyOf, CATEGORY, getCategory, getHeading, stripTags } from '@/lib/joomla';
import { iconFrom } from '@/lib/icons';
import { localePath, t, type Locale } from '@/lib/i18n';

export default async function Services({ locale }: { locale: Locale }) {
  const [services, heading] = await Promise.all([
    getCategory(CATEGORY.services, locale),
    getHeading('services', locale),
  ]);
  if (services.length === 0) return null;
  const base = localePath(locale) === '/' ? '' : localePath(locale);

  return (
    <section id="services" className="scroll-mt-16 border-t border-border bg-muted/30 px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{heading}</h2>

        <ul className="mt-12 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => {
            const Icon = iconFrom(s.attributes.icon);
            return (
              <li key={s.id}>
                <span className="grid size-11 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 text-lg font-medium tracking-tight">{s.attributes.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {stripTags(bodyOf(s))}
                </p>
                <Link
                  href={`${base}/services/${s.id}`}
                  className="group mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  {t(locale).learnMore}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
