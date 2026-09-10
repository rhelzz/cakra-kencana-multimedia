import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Slash } from 'lucide-react';
import { CustomerLogoGrid, type CustomerLogo } from '@/components/Customers';
import { CATEGORY, getCategory, getHeading, imageOf } from '@/lib/joomla';
import { isLocale, localePath, t, type Locale } from '@/lib/i18n';

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/customers'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: await getHeading('customers', locale) };
}

export default async function CustomersPage({ params }: PageProps<'/[locale]/customers'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const currentLocale = locale as Locale;
  const [customers, heading] = await Promise.all([
    getCategory(CATEGORY.customers, currentLocale),
    getHeading('customers', currentLocale),
  ]);
  const logos: CustomerLogo[] = customers.flatMap((customer) => {
    const src = imageOf(customer);
    return src ? [{ id: customer.id, src, alt: customer.attributes.title }] : [];
  });
  const base = localePath(currentLocale) === '/' ? '' : localePath(currentLocale);
  const ui = t(currentLocale);

  return (
    <main id="main-content" className="flex-1 pt-20">
      <header className="relative isolate overflow-hidden border-b border-border bg-surface-container-low px-4 py-14 sm:px-6 lg:py-20">
        <div aria-hidden className="pattern-diagonal pointer-events-none absolute inset-0 -z-10 opacity-[0.07]" />
        <div aria-hidden className="pointer-events-none absolute -left-32 top-1/2 -z-10 size-96 -translate-y-1/2 rounded-full bg-primary opacity-10 blur-3xl" />

        <div className="mx-auto max-w-6xl">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
              <li>
                <Link
                  href={base || '/'}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 py-1.5 pl-2.5 pr-3.5 font-medium text-muted-foreground backdrop-blur-sm transition duration-300 ease-settle hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] motion-reduce:transition-none"
                >
                  <ChevronLeft className="size-4 transition-transform duration-500 ease-settle group-hover:-translate-x-0.5 motion-reduce:transition-none" />
                  {ui.home}
                </Link>
              </li>
              <li aria-hidden className="text-border">
                <Slash className="size-3.5 -rotate-12" />
              </li>
              <li aria-current="page" className="font-medium text-foreground">{heading}</li>
            </ol>
          </nav>

          <div className="mt-10 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                <span aria-hidden className="h-px w-8 bg-primary" />
                {ui.allClients}
              </p>
              <h1 className="mt-5 max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
                {heading}
              </h1>
            </div>
            <p className="flex shrink-0 items-baseline gap-2 border-l-2 border-primary pl-4 sm:border-l-0 sm:border-r-2 sm:pl-0 sm:pr-4 sm:text-right">
              <span className="text-3xl font-semibold tabular-nums text-primary sm:text-4xl">{logos.length}</span>
              <span className="text-sm text-muted-foreground">{ui.clientUnit}</span>
            </p>
          </div>
        </div>
      </header>

      <section className="bg-neutral-950 px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <CustomerLogoGrid logos={logos} featured />
        </div>
      </section>
    </main>
  );
}
