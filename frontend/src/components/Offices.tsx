import { MapPin } from 'lucide-react';
import { bodyOf, CATEGORY, getCategory, getHeading, stripTags } from '@/lib/joomla';
import { t, type Locale } from '@/lib/i18n';
import { iconFrom } from '@/lib/icons';

export default async function Offices({ locale }: { locale: Locale }) {
  const [offices, heading] = await Promise.all([
    getCategory(CATEGORY.offices, locale),
    getHeading('offices', locale),
  ]);
  if (offices.length === 0) return null;

  return (
    <section id="offices" className="scroll-mt-16 border-t border-border bg-background px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {heading}
        </h2>

        <ul className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2">
          {offices.map((office) => {
            const Icon = iconFrom(office.attributes.icon);
            const map = office.attributes.map?.trim();
            return (
              <li key={office.id}>
                <h3 className="flex items-center gap-2.5 text-lg font-medium tracking-tight">
                  <Icon className="size-5 shrink-0 text-muted-foreground" />
                  {office.attributes.title}
                </h3>
                <address className="mt-3 max-w-md text-sm not-italic leading-relaxed text-muted-foreground">
                  {stripTags(bodyOf(office))}
                </address>
                {/* No map link on the Joomla record — e.g. a list of cities — so no dead button. */}
                {map && (
                  <a
                    href={map}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    <MapPin className="size-3.5" />
                    {t(locale).openMap}
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
