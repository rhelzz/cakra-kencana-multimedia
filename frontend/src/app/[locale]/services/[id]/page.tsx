import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, ArrowRight, Slash } from 'lucide-react';
import { notFound } from 'next/navigation';
import {
  baseAlias,
  bodyOf,
  CATEGORY,
  getCategory,
  getSubServices,
  imageAltOf,
  imageOf,
  stripTags,
  getHeading,
} from '@/lib/joomla';
import { iconFrom } from '@/lib/icons';
import { isLocale, localePath, t, type Locale } from '@/lib/i18n';

/**
 * The icon component is looked up from a Joomla value, so it can only be resolved at render.
 * The lint rule guards against losing component state — lucide icons are stateless SVGs
 * rendered on the server, so there is no state to lose.
 */
function Icon({ field, className }: { field: unknown; className?: string }) {
  const Glyph = iconFrom(field);
  // eslint-disable-next-line react-hooks/static-components
  return <Glyph className={className} />;
}

/** One request gives both the service and its siblings, and doubles as the 404 check. */
async function load(id: string, locale: Locale) {
  const services = await getCategory(CATEGORY.services, locale);
  const service = services.find((s) => String(s.id) === id);
  if (!service) notFound();
  return { service, siblings: services.filter((s) => s.id !== service.id) };
}

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/services/[id]'>): Promise<Metadata> {
  const { id, locale } = await params;
  if (!isLocale(locale)) return {};
  const { service } = await load(id, locale);
  return {
    title: service.attributes.title,
    description: stripTags(bodyOf(service)),
  };
}

export default async function ServicePage({ params }: PageProps<'/[locale]/services/[id]'>) {
  const { id, locale } = await params;
  if (!isLocale(locale)) notFound();

  const [{ service, siblings }, heading] = await Promise.all([
    load(id, locale),
    getHeading('services', locale),
  ]);
  const subServices = await getSubServices(baseAlias(service.attributes.alias), locale);
  const ui = t(locale);
  const base = localePath(locale) === '/' ? '' : localePath(locale);
  const heroImg = imageOf(service);

  return (
    <main className="flex-1 pt-20">
      <article>
        {/* The page used to run at one width from top to bottom, which is what made it read as
            flat. The measure now changes with the job: `max-w-6xl` for the header band and the
            supporting grids, `max-w-3xl` for prose — because a paragraph is only comfortable
            near 65 characters no matter how wide the page is. */}
        <header className="relative isolate overflow-hidden border-b border-border bg-muted/30 px-4 pb-24 pt-14 sm:px-6 lg:pb-32 lg:pt-20">
          <div
            aria-hidden
            className="pattern-diagonal pointer-events-none absolute inset-0 -z-10 opacity-[0.07]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-32 top-0 -z-10 size-96 -translate-y-1/3 rounded-full bg-primary opacity-10 blur-3xl"
          />

          <div className="mx-auto max-w-6xl">
            {/* Three levels, so a visitor who landed here from search knows where "here" is.
                The old back link pointed at the home page's services block, which since the
                listing page exists is no longer where this page came from. */}
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                <li>
                  <Link
                    href={base || '/'}
                    className="font-medium text-muted-foreground transition-colors duration-200 ease-exit hover:text-primary"
                  >
                    {ui.home}
                  </Link>
                </li>
                <li aria-hidden className="text-border">
                  <Slash className="size-3.5 -rotate-12" />
                </li>
                <li>
                  <Link
                    href={`${base}/services`}
                    className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 py-1.5 pl-2.5 pr-3.5 font-medium text-muted-foreground backdrop-blur-sm transition duration-300 ease-settle hover:border-primary/50 hover:text-primary active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
                  >
                    <ArrowLeft className="size-4 transition-transform duration-500 ease-settle group-hover:-translate-x-0.5 motion-reduce:transition-none" />
                    {heading}
                  </Link>
                </li>
              </ol>
            </nav>

            <div className="mt-10 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="grid size-14 place-items-center rounded-xl bg-primary text-primary-foreground shadow-brand">
                  <Icon field={service.attributes.icon} className="size-7" />
                </span>
                <h1 className="mt-6 max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                  {service.attributes.title}
                </h1>
              </div>

              {/* Only shown when there is something to count — an empty "0 Item" would be a
                  worse signal than no signal. */}
              {subServices.length > 0 && (
                <p className="flex shrink-0 items-baseline gap-2 border-l-2 border-primary pl-4 sm:border-l-0 sm:border-r-2 sm:pl-0 sm:pr-4 sm:text-right">
                  <span className="text-3xl font-semibold tabular-nums text-primary sm:text-4xl">
                    {subServices.length}
                  </span>
                  <span className="text-sm text-muted-foreground">{ui.scopeUnit}</span>
                </p>
              )}
            </div>
          </div>
        </header>

        {/* Pulled up over the header's bottom edge. The overlap is the one piece of real depth
            on the page: it ties the band and the body together instead of stacking two flat
            slabs, and it is why the header carries extra bottom padding. */}
        {heroImg && (
          <div className="relative z-10 -mt-16 px-4 sm:px-6 lg:-mt-24">
            <img
              src={heroImg}
              alt={imageAltOf(service)}
              className="reveal mx-auto aspect-video w-full max-w-5xl rounded-2xl border border-border object-cover shadow-brand"
            />
          </div>
        )}

        <div
          className={`mx-auto max-w-3xl px-4 pb-16 text-base leading-relaxed text-pretty text-muted-foreground sm:px-6 [&_li]:mt-2 [&_p]:mt-5 [&_ul]:mt-5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:marker:text-primary ${
            heroImg ? 'pt-14' : 'pt-16'
          }`}
          dangerouslySetInnerHTML={{ __html: bodyOf(service) }}
        />

        {/* The sub-services are the substance of this page — one service can carry 26 of them —
            so they get their own band and the full width, instead of being a footnote squeezed
            into the reading column. */}
        {subServices.length > 0 && (
          <section className="border-t border-border bg-muted/30 px-4 py-16 sm:px-6 lg:py-20">
            <div className="mx-auto max-w-6xl">
              <h2 className="reveal flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                <span aria-hidden className="h-px w-8 bg-primary" />
                {ui.scope}
              </h2>

              {/* Masonry via CSS columns, kept from the original: sub-service descriptions vary
                  a lot in length and a fixed grid would leave ragged gaps. The reveal sits on
                  the container rather than each card — animating individual column children
                  risks them jumping between columns mid-transform. */}
              <div className="reveal mt-10 columns-1 gap-5 sm:columns-2 lg:columns-3">
                {subServices.map((sub) => (
                  <div
                    key={sub.id}
                    className="group mb-5 break-inside-avoid rounded-xl border border-border bg-card p-5 transition duration-500 ease-settle hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-brand motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                  >
                    <h3 className="flex items-start gap-2.5 text-sm font-medium tracking-tight text-pretty">
                      <span
                        aria-hidden
                        className="mt-1.5 size-1.5 shrink-0 rounded-full bg-border transition-colors duration-300 ease-exit group-hover:bg-primary motion-reduce:transition-none"
                      />
                      {sub.attributes.title}
                    </h3>
                    <p className="mt-2 pl-5 text-sm leading-relaxed text-pretty text-muted-foreground">
                      {stripTags(bodyOf(sub))}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </article>

      {siblings.length > 0 && (
        <section className="border-t border-border px-4 py-16 sm:px-6 lg:py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="reveal flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <span aria-hidden className="h-px w-8 bg-primary" />
              {ui.otherServices}
            </h2>
            {/* Rows rather than a card grid: this is a way out of the page, not a second
                catalogue competing with the content above it. */}
            <ul className="reveal-stagger mt-8 grid gap-x-10 sm:grid-cols-2">
              {siblings.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`${base}/services/${s.id}`}
                    className="group flex items-center gap-4 border-b border-border py-4 text-sm font-medium transition-colors duration-200 ease-exit hover:text-primary"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-primary transition-transform duration-500 ease-settle group-hover:scale-110 motion-reduce:transition-none">
                      <Icon field={s.attributes.icon} className="size-4" />
                    </span>
                    <span className="flex-1 text-pretty">{s.attributes.title}</span>
                    <ArrowRight className="size-4 shrink-0 -translate-x-2 text-primary opacity-0 transition duration-500 ease-settle group-hover:translate-x-0 group-hover:opacity-100 motion-reduce:transition-none" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </main>
  );
}
