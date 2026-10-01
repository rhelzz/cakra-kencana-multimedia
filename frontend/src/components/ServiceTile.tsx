import { bodyOf, stripTags, type Article } from '@/lib/joomla';
import { iconFrom } from '@/lib/icons';

/** Resolved from a Joomla value, so it can only be looked up at render. */
function Icon({ field, className }: { field: unknown; className?: string }) {
  const Glyph = iconFrom(field);
  // eslint-disable-next-line react-hooks/static-components
  return <Glyph className={className} strokeWidth={1.5} aria-hidden />;
}

/**
 * One tile of the home services grid: line-art icon, label, and a short
 * description. The tile is static — the full listing lives on /services —
 * and the inner heading names it to assistive tech.
 */
export default function ServiceTile({ service }: { service: Article }) {
  return (
    <li className="flex min-h-[148px] flex-col rounded-xl border border-border bg-surface-container-low p-4 transition-colors duration-300 ease-exit hover:border-primary/40 hover:bg-accent motion-reduce:transition-none sm:p-6 lg:min-h-[168px]">
      <Icon
        field={service.attributes.icon}
        className="size-7 text-primary sm:size-8"
      />
      <h3 className="mt-4 text-balance text-[13px] font-semibold leading-snug sm:text-[15px]">
        {service.attributes.title}
      </h3>
      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
        {stripTags(bodyOf(service))}
      </p>
    </li>
  );
}
