import { MapPin } from 'lucide-react';
import {
  bodyOf,
  CATEGORY,
  getArticle,
  getCategory,
  getMenu,
  getSiteName,
  mediaUrl,
  stripTags,
} from '@/lib/joomla';
import { localePath, t, type Locale } from '@/lib/i18n';
import SocialLinks from '@/components/SocialLinks';

export default async function Footer({ locale }: { locale: Locale }) {
  const [items, offices, hero, copyright, siteName] = await Promise.all([
    getMenu(locale),
    getCategory(CATEGORY.offices, locale),
    getArticle('home-hero', locale),
    getArticle('footer-copyright', locale),
    getSiteName(),
  ]);

  const ui = t(locale);
  // The footer also renders on detail pages, where a bare "#about" points at nothing.
  const base = localePath(locale) === '/' ? '' : localePath(locale);
  const resolve = (href: string) => (href.startsWith('#') ? `${base}/${href}` : href);
  // The head office is simply the first one an editor ordered in Joomla.
  const head = offices[0];
  const tagline = stripTags(hero ? bodyOf(hero) : '');
  // The article may contain {year} so an editor never has to touch it again in January.
  const copy = stripTags(copyright ? bodyOf(copyright) : '').replace(
    '{year}',
    String(new Date().getFullYear()),
  );

  return (
    <footer className="border-t border-border bg-muted/40 px-4 py-14 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mediaUrl('images/logo.png')}
              alt={siteName}
              className="h-12 w-auto rounded-md bg-white p-1"
            />
            {tagline && (
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
                {tagline}
              </p>
            )}
            <SocialLinks locale={locale} />
          </div>

          <nav aria-label={ui.navigation}>
            <h2 className="text-sm font-semibold tracking-tight">{ui.navigation}</h2>
            <ul className="mt-4 space-y-2.5">
              {items.map((i) => (
                <li key={i.id}>
                  <a
                    href={resolve(i.href)}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {i.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {head && (
            <div>
              <h2 className="text-sm font-semibold tracking-tight">{head.attributes.title}</h2>
              <address className="mt-4 text-sm not-italic leading-relaxed text-muted-foreground">
                {stripTags(bodyOf(head))}
              </address>
              {head.attributes.map?.trim() && (
                <a
                  href={head.attributes.map}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  <MapPin className="size-3.5" />
                  {ui.openMap}
                </a>
              )}
            </div>
          )}
        </div>

        <div className="mt-12 border-t border-border pt-6">
          <p className="text-sm text-muted-foreground">{copy}</p>
        </div>
      </div>
    </footer>
  );
}
