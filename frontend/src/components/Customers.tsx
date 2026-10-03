import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';
import { CATEGORY, getCategory, getHeading, imageOf } from '@/lib/joomla';
import { localePath, t, type Locale } from '@/lib/i18n';

export type CustomerLogo = { id: number; src: string; alt: string };

const FEATURED_COUNT = 8;

/**
 * Backdrop unique to this section — deliberately NOT the WhyUs wedge:
 * a dot-matrix strip, a thin outline ring peeking from behind the logo
 * wall, and two plus marks. All solid shapes, no gradients. The ring and
 * pluses hide on phones to keep the small viewport clean.
 */
function CustomerBackdrop() {
  return (
    <>
      <svg
        aria-hidden
        fill="none"
        viewBox="0 0 100 180"
        className="pointer-events-none absolute left-3 top-10 w-16 text-primary sm:left-6 lg:w-24"
      >
        {Array.from({ length: 45 }, (_, k) => (
          <circle
            key={k}
            cx={10 + (k % 5) * 20}
            cy={10 + Math.floor(k / 5) * 20}
            r="3"
            fill="currentColor"
            opacity="0.3"
          />
        ))}
      </svg>
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-44 -right-44 hidden size-[24rem] rounded-full border-[22px] border-primary/10 sm:block"
      />
      <Plus
        aria-hidden
        className="absolute right-8 top-8 hidden size-5 text-primary/40 sm:block"
      />
      <Plus
        aria-hidden
        className="absolute bottom-10 left-1/3 hidden size-4 text-primary/30 lg:block"
      />
    </>
  );
}

export default async function Customers({ locale }: { locale: Locale }) {
  const [customers, eyebrow, heading] = await Promise.all([
    getCategory(CATEGORY.customers, locale),
    getHeading('customers-eyebrow', locale),
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
    // Solid ground in both modes, so original-colour logos always sit on
    // white tiles. All colour comes from theme tokens — dark mode just works.
    <section
      id="customers"
      className="relative scroll-mt-20 overflow-hidden border-t border-border bg-background px-4 py-14 sm:px-6 lg:py-20"
    >
      <CustomerBackdrop />
      <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-12 lg:items-start lg:gap-8 xl:gap-12">
        <div className="reveal lg:col-span-5 lg:pt-2">
          {eyebrow && (
            <p className="flex items-center gap-3 text-base font-bold uppercase tracking-[0.18em] text-primary">
              <span aria-hidden className="block h-1 w-12 rounded-full bg-primary" />
              {eyebrow}
            </p>
          )}
          <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.5rem] lg:leading-[1.12]">
            {heading}
          </h2>
          {logos.length > FEATURED_COUNT && (
            <Link
              href={`${base}/customers`}
              className="group mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-brand transition duration-500 ease-settle hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0 lg:mt-8"
            >
              {ui.viewAllClients.replace('{count}', String(logos.length))}
              <ArrowRight className="size-4 transition-transform duration-500 ease-settle group-hover:translate-x-1 motion-reduce:transition-none" />
            </Link>
          )}
        </div>

        {/* White tiles in both modes, so original-colour logos always have
            a light ground — the same device the deck uses. */}
        <ul className="reveal-stagger grid grid-cols-2 items-center gap-x-8 gap-y-8 self-center sm:grid-cols-4 lg:col-span-7 lg:gap-x-8 lg:gap-y-10 [&_li:nth-child(5)_img]:h-9 [&_li:nth-child(5)_img]:max-w-[140px] [&_li:nth-child(6)_img]:h-9 [&_li:nth-child(6)_img]:max-w-[140px] lg:[&_li:nth-child(5)_img]:h-10 lg:[&_li:nth-child(5)_img]:max-w-[150px] lg:[&_li:nth-child(6)_img]:h-10 lg:[&_li:nth-child(6)_img]:max-w-[150px]">
          {logos.slice(0, FEATURED_COUNT).map((logo) => (
            <li
              key={logo.id}
              className="flex h-20 items-center justify-center rounded-xl border border-border bg-white p-3 transition duration-300 ease-exit hover:-translate-y-0.5 hover:shadow-brand motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:h-[88px]"
            >
              {/* Logos come from Joomla at runtime, so they intentionally remain plain images. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logo.src}
                alt={logo.alt}
                loading="lazy"
                className="h-7 w-auto max-w-[104px] object-contain sm:max-w-[112px] lg:h-8 lg:max-w-[120px]"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
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
