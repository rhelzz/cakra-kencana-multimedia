import { Globe } from 'lucide-react';
import { CATEGORY, fieldValue, getCategory } from '@/lib/joomla';
import { BRAND_PATHS } from '@/lib/social';
import type { Locale } from '@/lib/i18n';

export default async function SocialLinks({ locale }: { locale: Locale }) {
  const accounts = await getCategory(CATEGORY.social, locale);

  const links = accounts.flatMap((a) => {
    const href = fieldValue(a.attributes.link);
    // An account with no URL yet is a broken link waiting to happen — skip it.
    if (!href) return [];
    return [{ id: a.id, href, label: a.attributes.title, brand: fieldValue(a.attributes.icon) }];
  });

  if (links.length === 0) return null;

  return (
    <ul className="mt-6 flex flex-wrap items-center gap-2">
      {links.map((link) => {
        const path = link.brand ? BRAND_PATHS[link.brand] : undefined;
        return (
          <li key={link.id}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
              title={link.label}
              className="grid size-9 place-items-center rounded-md border border-border text-muted-foreground transition duration-500 ease-settle hover:-translate-y-0.5 hover:border-primary hover:text-primary active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              {path ? (
                // simple-icons ships one path on a 24×24 grid; currentColor keeps it themeable.
                <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[1.05rem] fill-current">
                  <path d={path} />
                </svg>
              ) : (
                <Globe className="size-[1.05rem]" />
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
