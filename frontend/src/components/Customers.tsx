import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CATEGORY, getCategory, getHeading, imageOf } from '@/lib/joomla';
import { localePath, t, type Locale } from '@/lib/i18n';

export type CustomerLogo = { id: number; src: string; alt: string };

const FEATURED_COUNT = 18;

export default async function Customers({ locale }: { locale: Locale }) {
  const [customers, heading] = await Promise.all([
    getCategory(CATEGORY.customers, locale),
    getHeading('customers', locale),
  ]);

  const logos = customers.flatMap((customer) => {
    const src = imageOf(customer);
    return src ? [{ id: customer.id, src, alt: customer.attributes.title }] : [];
  });

  if (logos.length === 0) return null;
  const ui = t(locale);
  const base = localePath(locale) === '/' ? '' : localePath(locale);

  return (
    <section
      id="customers"
      className="relative isolate scroll-mt-20 overflow-hidden bg-neutral-950 px-4 py-20 sm:px-6"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-64 w-184 max-w-[95vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary opacity-20 blur-3xl"
      />
      <div className="mx-auto max-w-6xl">
        <h2 className="reveal max-w-2xl text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl">
          {heading}
        </h2>
        <span aria-hidden className="reveal mt-5 block h-1 w-14 rounded-full bg-primary" />

        <CustomerMarquee logos={logos.slice(0, FEATURED_COUNT)} />

        {logos.length > FEATURED_COUNT && (
          <Link
            href={`${base}/customers`}
            className="group mx-auto mt-12 flex w-fit items-center gap-2 rounded-md border border-white/20 px-5 py-3 text-sm font-medium text-white transition duration-300 ease-exit hover:border-primary hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {ui.viewAllClients.replace('{count}', String(logos.length))}
            <ArrowRight className="size-4 text-primary transition duration-500 ease-settle group-hover:translate-x-1 group-hover:text-white motion-reduce:transition-none" />
          </Link>
        )}
      </div>
    </section>
  );
}

function CustomerMarquee({ logos }: { logos: CustomerLogo[] }) {
  return (
    <div className="customer-marquee mt-14 overflow-hidden py-2">
      <div className="customer-marquee-track flex w-max gap-6">
        {[false, true].map((duplicate) => (
          <ul key={String(duplicate)} aria-hidden={duplicate || undefined} className="flex gap-6">
            {logos.map((logo) => (
              <li key={logo.id} className="flex h-24 w-44 shrink-0 items-center justify-center rounded-lg bg-white p-4 sm:w-52">
                {/* Logos come from Joomla at runtime, so they intentionally remain plain images. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo.src}
                  alt={duplicate ? '' : logo.alt}
                  loading="lazy"
                  className="max-h-full max-w-full object-contain"
                />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

export function CustomerLogoGrid({
  logos,
  featured = false,
}: {
  logos: CustomerLogo[];
  featured?: boolean;
}) {
  return (
    <ul
      className={`grid grid-cols-3 items-center gap-x-6 gap-y-8 sm:grid-cols-4 md:grid-cols-6 ${
        featured ? 'reveal-stagger mt-14' : 'mt-12 lg:grid-cols-8'
      }`}
    >
      {logos.map((logo) => (
        <li
          key={logo.id}
          className={`flex items-center justify-center rounded-lg bg-white ${featured ? 'h-20 p-3' : 'h-16 p-2.5'}`}
        >
          {/* Logos come from Joomla at runtime, so they intentionally remain plain images. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logo.src}
            alt={logo.alt}
            loading="lazy"
            className="max-h-full max-w-full object-contain transition duration-500 ease-settle hover:scale-105 motion-reduce:transition-none motion-reduce:hover:scale-100"
          />
        </li>
      ))}
    </ul>
  );
}
