import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CATEGORY, getCategory, getHeading, imageOf } from '@/lib/joomla';
import { localePath, t, type Locale } from '@/lib/i18n';

export type CustomerLogo = { id: number; src: string; alt: string };

const FEATURED_COUNT = 8;

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
    // Light island in both modes: fixed pale stage + blue/grey-blue frame, so
    // original-colour logos keep a light ground. One etched top edge instead
    // of a flat hairline; a soft lift shadow only in dark mode.
    <section
      id="customers"
      className="scroll-mt-20 border-t border-t-[#004392]/10 px-4 py-14 dark:shadow-[0_-24px_48px_-24px_rgb(0_0_0/0.45)] sm:px-6 lg:py-20"
      style={{
        backgroundImage:
          'radial-gradient(600px 320px at 68% 56%, rgb(255 255 255 / 0.95) 0%, rgb(255 255 255 / 0) 70%), radial-gradient(680px 360px at 0% 0%, rgb(0 67 146 / 0.10) 0%, transparent 70%), radial-gradient(720px 400px at 100% 100%, rgb(0 67 146 / 0.07) 0%, transparent 70%), linear-gradient(112deg, #DCE8FB 0%, #E6EEFA 30%, #F5F7FA 60%, #E4E9EF 100%)',
        boxShadow: 'inset 0 1px 0 rgb(255 255 255 / 0.65)',
      }}
    >
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-12 lg:items-start lg:gap-8 xl:gap-12">
        <div className="reveal lg:col-span-5 lg:pt-2">
          {eyebrow && (
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#004392]">
              <span aria-hidden className="block h-[3px] w-8 rounded-full bg-[#004392]" />
              {eyebrow}
            </p>
          )}
          <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight text-[#0A1E3C] sm:text-4xl lg:text-[2.5rem] lg:leading-[1.12]">
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

        {/* Optical boost: sari-roti (#5) & mie-gacoan (#6) are compact/thin-stroked
            and read tiny next to wide wordmarks at uniform height. COUPLED to
            the curated top-8 ordering — re-check if the order changes. */}
        <ul className="reveal-stagger grid grid-cols-2 items-center gap-x-8 gap-y-8 self-center sm:grid-cols-4 lg:col-span-7 lg:gap-x-8 lg:gap-y-10 [&_li:nth-child(5)_img]:h-9 [&_li:nth-child(5)_img]:max-w-[140px] [&_li:nth-child(6)_img]:h-9 [&_li:nth-child(6)_img]:max-w-[140px] lg:[&_li:nth-child(5)_img]:h-10 lg:[&_li:nth-child(5)_img]:max-w-[150px] lg:[&_li:nth-child(6)_img]:h-10 lg:[&_li:nth-child(6)_img]:max-w-[150px]">
          {logos.slice(0, FEATURED_COUNT).map((logo) => (
            <li key={logo.id} className="flex h-16 items-center justify-center sm:h-[72px]">
              {/* Logos come from Joomla at runtime, so they intentionally remain plain images. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logo.src}
                alt={logo.alt}
                loading="lazy"
                className="h-7 w-auto max-w-[104px] object-contain mix-blend-multiply sm:max-w-[112px] lg:h-8 lg:max-w-[120px]"
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
