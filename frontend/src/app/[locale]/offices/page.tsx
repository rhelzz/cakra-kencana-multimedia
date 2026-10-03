import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, MapPin, Slash } from 'lucide-react';
import {
  bodyOf,
  CATEGORY,
  getCategory,
  getHeading,
  pageHeaderImage,
  stripTags,
  type Article,
} from '@/lib/joomla';
import { iconFrom } from '@/lib/icons';
import { isLocale, localePath, t, type Locale } from '@/lib/i18n';

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/offices'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: await getHeading('offices', locale) };
}

export default async function OfficesPage({ params }: PageProps<'/[locale]/offices'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [offices, heading, headers] = await Promise.all([
    getCategory(CATEGORY.offices, locale as Locale),
    getHeading('offices', locale as Locale),
    getCategory(CATEGORY.pageHeaders, locale as Locale),
  ]);
  const headerBg = pageHeaderImage(headers, 'offices');
  const base = localePath(locale as Locale) === '/' ? '' : localePath(locale as Locale);
  const ui = t(locale as Locale);

  return (
    // pt-20, not pt-16: the header is fixed and solid at `h-20` on every page but the home
    // page, so anything less tucks the first heading under the bar.
    <main id="main-content" className="flex-1 pt-20">
      <header className="relative isolate overflow-hidden border-b border-border bg-surface-container-low px-4 py-14 sm:px-6 lg:py-20">
        {/* Two layers, both fading out, so the band is furnished without becoming busy:
            the diagonal print rules give it texture and the bloom gives it a light source.
            Everything sits behind the content and neither tints a single glyph. */}
        {/* Custom header photo from Joomla (Page Headers category); the scrim
            keeps text readable while the band texture stays on top. */}
        {headerBg && (
          <>
            <div aria-hidden className="absolute inset-0 -z-20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={headerBg}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-gradient-to-r from-surface-container-low via-surface-container-low/85 to-surface-container-low/35"
            />
          </>
        )}
        <div
          aria-hidden
          className="pattern-diagonal pointer-events-none absolute inset-0 -z-10 opacity-[0.07]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 top-1/2 -z-10 size-96 -translate-y-1/2 rounded-full bg-primary opacity-10 blur-3xl"
        />

        <div className="mx-auto max-w-6xl">
          {/* Breadcrumb doubles as the way back. `aria-current="page"` marks the leaf, and the
              separators are decorative so a screen reader reads "Beranda, heading"
              rather than spelling out slashes. */}
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
              <li>
                <Link
                  href={base || '/'}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 py-1.5 pl-2.5 pr-3.5 font-medium text-muted-foreground backdrop-blur-sm transition duration-300 ease-settle hover:border-primary/50 hover:text-primary active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
                >
                  <ChevronLeft className="size-4 transition-transform duration-500 ease-settle group-hover:-translate-x-0.5 motion-reduce:transition-none" />
                  {ui.home}
                </Link>
              </li>
              <li aria-hidden className="text-border">
                <Slash className="size-3.5 -rotate-12" />
              </li>
              <li aria-current="page" className="font-medium text-foreground">
                {heading}
              </li>
            </ol>
          </nav>

          {/* The count sits opposite the title on desktop: it fills the empty right half,
              and it is a real number from Joomla rather than decoration. */}
          <div className="mt-10 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="flex items-center gap-3 text-base font-bold uppercase tracking-[0.18em] text-primary">
                <span aria-hidden className="h-1 w-12 bg-primary" />
                {ui.allOffices}
              </p>
              <h1 className="mt-5 max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                {heading}
              </h1>
            </div>

            <p className="flex shrink-0 items-center gap-3 self-start rounded-xl border border-border/60 bg-background/70 px-5 py-3 backdrop-blur-sm sm:self-auto">
              <span className="text-3xl font-semibold tabular-nums text-primary sm:text-4xl">
                {offices.length}
              </span>
              <span aria-hidden className="h-8 w-px bg-primary/30" />
              <span className="text-sm text-muted-foreground">{ui.officeUnit}</span>
            </p>
          </div>
        </div>
      </header>

      <div className="overflow-x-clip px-4 py-16 sm:px-6 lg:py-24">
        <ul className="reveal-stagger mx-auto grid max-w-6xl gap-6 sm:grid-cols-2">
          {offices.map((office) => (
            <OfficeItem key={office.id} office={office} openMapLabel={ui.openMap} />
          ))}
        </ul>
      </div>
    </main>
  );
}

/** Same shape as the helper in ServiceCard: the glyph is named by a Joomla field value, so it
 *  can only be resolved at render, and that trips `react-hooks/static-components`. */
function Icon({ field, className }: { field: unknown; className?: string }) {
  const Glyph = iconFrom(field);
  // eslint-disable-next-line react-hooks/static-components
  return <Glyph className={className} />;
}

/** One office per cell, mirroring the home Offices section: a left rule in brand red
 *  instead of a full border, with the address and an Open Map button when the Joomla
 *  record carries a map link. */
function OfficeItem({ office, openMapLabel }: { office: Article; openMapLabel: string }) {
  const map = office.attributes.map?.trim();
  return (
    <li className="group border-l-2 border-border pl-5 transition-colors duration-300 ease-exit hover:border-primary motion-reduce:transition-none">
      <h2 className="flex items-center gap-2.5 text-lg font-medium tracking-tight">
        <Icon field={office.attributes.icon} className="size-5 shrink-0 text-primary" />
        {office.attributes.title}
      </h2>
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
          {openMapLabel}
        </a>
      )}
    </li>
  );
}
