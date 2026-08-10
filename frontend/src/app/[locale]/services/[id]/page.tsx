import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { notFound } from 'next/navigation';
import { bodyOf, CATEGORY, getCategory, getHeading, stripTags } from '@/lib/joomla';
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
  const ui = t(locale);
  const base = localePath(locale) === '/' ? '' : localePath(locale);

  return (
    <main className="flex-1 pt-16">
      <article>
        <header className="border-b border-border bg-muted/30 px-4 py-14 sm:px-6 lg:py-20">
          <div className="mx-auto max-w-3xl">
            <Link
              href={`${base}/#services`}
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
              {heading}
            </Link>

            <span className="mt-8 grid size-14 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Icon field={service.attributes.icon} className="size-7" />
            </span>
            <h1 className="mt-5 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              {service.attributes.title}
            </h1>
          </div>
        </header>

        <div
          className="mx-auto max-w-3xl px-4 py-12 text-base leading-relaxed text-muted-foreground sm:px-6 [&_li]:mt-2 [&_p]:mt-5 [&_ul]:mt-5 [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: bodyOf(service) }}
        />
      </article>

      {siblings.length > 0 && (
        <section className="border-t border-border px-4 py-14 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-sm font-semibold tracking-tight">{ui.otherServices}</h2>
            <ul className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {siblings.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`${base}/services/${s.id}`}
                      className="group flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-colors hover:text-primary"
                    >
                      <Icon field={s.attributes.icon} className="size-4 shrink-0 text-primary" />
                      <span className="flex-1">{s.attributes.title}</span>
                      <ArrowRight className="size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
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
