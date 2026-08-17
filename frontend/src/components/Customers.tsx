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
    <section
      id="customers"
      className="relative isolate scroll-mt-20 overflow-hidden bg-neutral-950 px-4 py-20 sm:px-6"
    >
      {/* The dark band is deliberate (see the note below), but a flat slab of near-black reads
          as a copy-paste accident in an otherwise light page. A soft red bloom ties it back to
          the brand and gives the section a light source. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-64 w-184 max-w-[95vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary opacity-20 blur-3xl"
      />
      <div className="mx-auto max-w-6xl">
        <h2 className="reveal max-w-2xl text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl">
          {heading}
        </h2>
        <span aria-hidden className="reveal mt-5 block h-1 w-14 rounded-full bg-primary" />

        {/* flex-wrap, bukan grid kolom tetap: deretan logo tetap rata tengah berapa pun jumlahnya. */}
        <ul className="reveal-stagger mt-14 flex flex-wrap items-center justify-center gap-x-12 gap-y-10">
          {logos.map((logo) => (
            <li key={logo.id} className="flex h-14 w-32 items-center justify-center sm:w-36">
              {/* brightness-0 + invert flattens any logo to solid white, so a row of mixed
                  brand colours reads as one set instead of a ransom note. Only works on
                  outline/wordmark logos — a filled block with knockout text becomes a blob.
                  Capping height AND width keeps tall and wide logos optically similar. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logo.src}
                alt={logo.alt}
                loading="lazy"
                className="max-h-full max-w-[85%] object-contain opacity-60 brightness-0 invert transition duration-500 ease-settle hover:scale-105 hover:opacity-100 motion-reduce:transition-none motion-reduce:hover:scale-100"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
