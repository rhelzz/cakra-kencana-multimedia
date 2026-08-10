import { CATEGORY, getCategory, getHeading, imageOf } from '@/lib/joomla';
import type { Locale } from '@/lib/i18n';

export default async function Customers({ locale }: { locale: Locale }) {
  const [customers, heading] = await Promise.all([
    getCategory(CATEGORY.customers, locale),
    getHeading('customers', locale),
  ]);

  const logos = customers.flatMap((c) => {
    const src = imageOf(c);
    return src ? [{ id: c.id, src, alt: c.attributes.title }] : [];
  });

  if (logos.length === 0) return null;

  return (
    // Deliberately dark in both themes: the logos are flattened to white, which needs a dark ground.
    <section id="customers" className="scroll-mt-16 bg-neutral-950 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {heading}
        </h2>

        <ul className="mt-14 grid grid-cols-2 items-center gap-x-8 gap-y-12 sm:grid-cols-3 lg:grid-cols-6">
          {logos.map((logo) => (
            <li key={logo.id} className="flex h-14 items-center justify-center">
              {/* brightness-0 + invert flattens any logo to solid white, so a row of mixed
                  brand colours reads as one set instead of a ransom note. Only works on
                  outline/wordmark logos — a filled block with knockout text becomes a blob.
                  Capping height AND width keeps tall and wide logos optically similar. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logo.src}
                alt={logo.alt}
                loading="lazy"
                className="max-h-full max-w-[85%] object-contain opacity-70 brightness-0 invert transition-opacity duration-200 hover:opacity-100"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
