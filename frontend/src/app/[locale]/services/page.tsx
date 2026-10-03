import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Slash } from 'lucide-react';
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
}: PageProps<'/[locale]/services'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: await getHeading('services', locale) };
}

export default async function ServicesPage({ params }: PageProps<'/[locale]/services'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [services, heading, headers] = await Promise.all([
    getCategory(CATEGORY.services, locale as Locale),
    getHeading('services', locale as Locale),
    getCategory(CATEGORY.pageHeaders, locale as Locale),
  ]);
  const headerBg = pageHeaderImage(headers, 'services');
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
              separators are decorative so a screen reader reads "Beranda, Layanan kami"
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
                {ui.allServices}
              </p>
              <h1 className="mt-5 max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                {heading}
              </h1>
            </div>

            <p className="flex shrink-0 items-center gap-3 self-start rounded-xl border border-border/60 bg-background/70 px-5 py-3 backdrop-blur-sm sm:self-auto">
              <span className="text-3xl font-semibold tabular-nums text-primary sm:text-4xl">
                {services.length}
              </span>
              <span aria-hidden className="h-8 w-px bg-primary/30" />
              <span className="text-sm text-muted-foreground">{ui.serviceUnit}</span>
            </p>
          </div>
        </div>
      </header>

      {/* overflow-x-clip is load-bearing: the rows below enter by sliding in from ±3.5rem,
          and without clipping that travel adds a horizontal scrollbar to the whole page on
          narrow screens. `clip` rather than `hidden` so no scroll container is created. */}
      <div className="overflow-x-clip px-4 py-16 sm:px-6 lg:py-24">
        <ul className="reveal-alternate mx-auto max-w-6xl">
          {services.map((service, i) => (
            <ServiceRow key={service.id} service={service} index={i} />
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

/** One service per row, alternating which side of the page the block sits on. The zig-zag is
 *  the point: a uniform grid invites skimming, while a line that keeps changing sides forces
 *  the eye to reset on every item — which is what you want when all eleven entries matter equally.
 */
function ServiceRow({ service, index }: { service: Article; index: number }) {
  const even = index % 2 === 1;

  return (
    <li className="relative border-t border-border first:border-t-0">
      <div
        // Real padding, on one scale: 4 → 6 → 8 across the breakpoints horizontally and
        // 12 → 16 vertically. The ordinal is the leftmost thing on the row, so without this
        // it sits flush against the container edge with nothing to breathe into.
        className="flex flex-col gap-6 rounded-xl px-4 py-12 sm:flex-row sm:items-start sm:gap-10 sm:px-6 lg:gap-14 lg:px-8 lg:py-16"
      >
        {/* `sm:contents` dissolves this wrapper at the breakpoint: on a phone the ordinal and
            the icon share one tidy line above the text, and from `sm` up they become direct
            flex children of the row so the order classes can place them. One markup tree,
            two layouts — no duplicated branch to drift out of sync. */}
        <span className="flex items-center gap-6 sm:contents">
          {/* Decorative: <ul>/<li> already convey the list, and a screen reader reading a bare
              number before every title is noise. A fixed width keeps 01 and 10 in the same
              column, and `tabular-nums` stops the digits jittering between rows. */}
          <span
            aria-hidden
            // `sm:pt-1` is an optical nudge, not a mathematical one: at `text-5xl` with
            // `leading-none` the digits' cap height starts higher than the title's, so
            // top-aligning them by the box leaves the number looking like it floated up.
            className={`w-14 shrink-0 text-4xl font-semibold leading-none tabular-nums text-border sm:w-20 sm:pt-1 sm:text-5xl ${
              even ? 'sm:order-3 sm:text-right' : ''
            }`}
          >
            {String(index + 1).padStart(2, '0')}
          </span>

          <span
            className={`grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-brand sm:size-14 ${
              even ? 'sm:order-2' : ''
            }`}
          >
            <Icon field={service.attributes.icon} className="size-6 sm:size-7" />
          </span>
        </span>

        <span className={`min-w-0 flex-1 ${even ? 'sm:order-1' : ''}`}>
          <span className="text-xl font-medium tracking-tight text-pretty sm:text-2xl">
            {service.attributes.title}
          </span>
          {/* max-w-2xl holds the line near 65 characters even though the row runs the full
              width of the container. */}
          <span className="mt-4 block max-w-2xl text-sm leading-relaxed text-pretty text-muted-foreground sm:text-[0.95rem]">
            {stripTags(bodyOf(service))}
          </span>
        </span>
      </div>
    </li>
  );
}
