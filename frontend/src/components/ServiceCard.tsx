import { bodyOf, stripTags, type Article } from '@/lib/joomla';
import { iconFrom } from '@/lib/icons';

/** Resolved from a Joomla value, so it can only be looked up at render. */
function Icon({ field, className }: { field: unknown; className?: string }) {
  const Glyph = iconFrom(field);
  // eslint-disable-next-line react-hooks/static-components
  return <Glyph className={className} />;
}

export default function ServiceCard({ service }: { service: Article }) {
  return (
    // `overflow-hidden` is load-bearing: the accent below is a straight line across the full
    // width, and without clipping its ends stick out past the rounded corners.
    <li className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card p-6 transition duration-500 ease-settle hover:-translate-y-1 hover:border-primary/40 hover:shadow-brand active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
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
    </li>
  );
}
