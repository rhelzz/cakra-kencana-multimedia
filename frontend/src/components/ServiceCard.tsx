import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { bodyOf, serviceSlug, stripTags, type Article } from '@/lib/joomla';
import { iconFrom } from '@/lib/icons';
import { t, type Locale } from '@/lib/i18n';

/** Resolved from a Joomla value, so it can only be looked up at render — see services/[id]/page.tsx. */
function Icon({ field, className }: { field: unknown; className?: string }) {
  const Glyph = iconFrom(field);
  // eslint-disable-next-line react-hooks/static-components
  return <Glyph className={className} />;
}

export default function ServiceCard({
  service,
  base,
  locale,
}: {
  service: Article;
  base: string;
  locale: Locale;
}) {
  return (
    // `flex flex-col` + `mt-auto` pins every "Selengkapnya" to the bottom, so a row of cards
    // with descriptions of different lengths still lines its links up.
    // `overflow-hidden` is load-bearing: the accent below is a straight line across the full
    // width, and without clipping its ends stick out past the rounded corners.
    // `has-[a:focus-visible]` puts the focus ring on the card, because the link that carries
    // focus is stretched invisibly over the whole card — outlining the link itself would draw
    // a box in the wrong place, and dropping the outline with no replacement would leave
    // keyboard users with nothing.
    <li className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card p-6 transition duration-500 ease-settle hover:-translate-y-1 hover:border-primary/40 hover:shadow-brand has-[a:focus-visible]:border-primary/40 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring/60 active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      {/* A bar of brand red that draws itself across the top edge on hover. Scales from the
          left on a transform, so it costs no layout work. */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-primary transition-transform duration-500 ease-settle group-hover:scale-x-100 motion-reduce:transition-none"
      />

      <span className="grid size-11 place-items-center rounded-lg bg-primary text-primary-foreground transition-transform duration-500 ease-settle group-hover:scale-105 motion-reduce:transition-none">
        <Icon field={service.attributes.icon} className="size-5" />
      </span>
      <h3 className="mt-5 text-lg font-medium tracking-tight text-pretty">
        {service.attributes.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
        {stripTags(bodyOf(service))}
      </p>

      <Link
        href={`${base}/services/${serviceSlug(service)}`}
        // `after:absolute after:inset-0` stretches the hit area over the whole card — a
        // finger-sized target on mobile — while the link itself stays a normal inline
        // element in the reading order.
        className="mt-auto pt-4 inline-flex items-center gap-1 self-start text-sm font-medium text-primary after:absolute after:inset-0 after:content-[''] hover:underline focus-visible:outline-none"
      >
        {t(locale).learnMore}
        <ArrowRight className="size-3.5 transition-transform duration-500 ease-settle group-hover:translate-x-1 motion-reduce:transition-none" />
      </Link>
    </li>
  );
}
