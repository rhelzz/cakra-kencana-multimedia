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
    <section id="offices" className="scroll-mt-20 border-t border-border bg-background px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <h2 className="reveal max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {heading}
        </h2>
        <span aria-hidden className="reveal mt-5 block h-1 w-14 rounded-full bg-primary" />

        <ul className="reveal-stagger mt-12 grid gap-6 sm:grid-cols-2">
          {offices.map((office) => {
            const Icon = iconFrom(office.attributes.icon);
            const map = office.attributes.map?.trim();
            return (
              // A left rule in brand red instead of a full border: it marks the block as one
              // address without boxing every office in its own card.
              <li
                key={office.id}
                className="group border-l-2 border-border pl-5 transition-colors duration-300 ease-exit hover:border-primary motion-reduce:transition-none"
              >
                <h3 className="flex items-center gap-2.5 text-lg font-medium tracking-tight">
                  <Icon className="size-5 shrink-0 text-primary" />
                  {office.attributes.title}
                </h3>
                <address className="mt-3 max-w-md text-sm not-italic leading-relaxed text-pretty text-muted-foreground">
                  {stripTags(bodyOf(office))}
                </address>
                {/* No map link on the Joomla record — e.g. a list of cities — so no dead button. */}
                {map && (
                  <a
                    href={map}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground transition duration-300 ease-settle hover:bg-primary hover:text-primary-foreground active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
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
