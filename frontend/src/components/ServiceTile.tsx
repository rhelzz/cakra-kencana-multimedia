import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { bodyOf, stripTags, type Article } from '@/lib/joomla';
import { iconFrom } from '@/lib/icons';

/** Resolved from a Joomla value, so it can only be looked up at render. */
function Icon({ field, className }: { field: unknown; className?: string }) {
  const Glyph = iconFrom(field);
  // eslint-disable-next-line react-hooks/static-components
  return <Glyph className={className} strokeWidth={1.5} aria-hidden />;
}

/**
 * One card of the home services teaser: tinted icon, title, full
 * description, and a "Learn More" link. Descriptions render in full — the
 * old clamped teaser truncated mid-sentence, which is what made the grid
 * feel cheap. There is no per-service detail page, so every card links to
 * the full /services list; the aria-label names the service so repeated
 * identical link text stays navigable. The tile is a static <li>, so the
 * link is the only interactive element inside.
 */
export default function ServiceTile({
  service,
  base,
  learnMore,
}: {
  service: Article;
  base: string;
  learnMore: string;
}) {
  const title = service.attributes.title;

  return (
    <li className="group flex flex-col rounded-2xl border border-border bg-card p-6 text-left transition-all duration-300 ease-exit hover:-translate-y-1 hover:border-primary/40 hover:shadow-brand motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <span className="grid size-12 place-items-center rounded-xl bg-primary/[0.07] text-primary">
        <Icon field={service.attributes.icon} className="size-6" />
      </span>
      <h3 className="mt-5 text-balance text-lg font-bold leading-snug">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {stripTags(bodyOf(service))}
      </p>
      <Link
        href={`${base}/services`}
        aria-label={`${learnMore}: ${title}`}
        className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-primary"
      >
        {learnMore}
        <ArrowRight className="size-4 transition-transform duration-300 ease-settle group-hover:translate-x-1 motion-reduce:transition-none" />
      </Link>
    </li>
  );
}
