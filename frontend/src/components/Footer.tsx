import { Mail, MapPin, MessageCircle } from 'lucide-react';
import {
  baseAlias,
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
  const [items, offices, contacts, tagline, copyright, siteName] = await Promise.all([
    getMenu(locale),
    getCategory(CATEGORY.offices, locale),
    getCategory(CATEGORY.contact, locale),
    getArticle('footer-tagline', locale, CATEGORY.uncategorised),
    getArticle('footer-copyright', locale, CATEGORY.uncategorised),
    getSiteName(),
  ]);

  const ui = t(locale);
  // Anchors need the locale base off the home page; full URLs pass through.
  const base = localePath(locale) === '/' ? '' : localePath(locale);
  const resolve = (href: string) => (href.startsWith('#') ? `${base}/${href}` : href);
  // The footer address is always the head office, regardless of section ordering.
  const head = offices.find((office) => baseAlias(office.attributes.alias) === 'office-head-office');
  const taglineTitle = tagline?.attributes.title ?? '';
  const taglineBody = tagline ? stripTags(bodyOf(tagline)) : '';
  const linkedContacts = contacts.filter((item) => item.attributes.link?.trim());
  // The article may contain {year} so an editor never has to touch it again in January.
  const copy = stripTags(copyright ? bodyOf(copyright) : '').replace(
    '{year}',
    String(new Date().getFullYear()),
  );

  return (
    // Dark island in both modes: fixed navy, white text throughout.
    <footer className="bg-[#0A1526] px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.2fr_1fr]">
          <div>
            {/* logo-footer.png ships on a black plate; mix-blend-screen melts
                black into the navy so no white tile is needed. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mediaUrl('images/logo-footer.png')} alt={siteName} className="h-40 w-auto max-w-full mix-blend-screen" />
            {taglineTitle && (
              <p className="mt-4 text-sm font-semibold text-white">{taglineTitle}</p>
            )}
            {taglineBody && (
              <p className="mt-1 max-w-sm text-sm leading-relaxed text-white/70">
                {taglineBody}
              </p>
            )}
          </div>

          <nav aria-label={ui.menu}>
            <h2 className="text-sm font-semibold tracking-tight text-white">{ui.menu}</h2>
            <ul className="mt-4 space-y-2.5">
              {items.map((i) => (
                <li key={i.id}>
                  <a
                    href={resolve(i.href)}
                    className="inline-block text-sm text-white/70 transition duration-500 ease-settle hover:translate-x-1 hover:text-white motion-reduce:transition-none motion-reduce:hover:translate-x-0"
                  >
                    {i.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-semibold tracking-tight text-white">{ui.contactUs}</h2>
            <div className="mt-4 space-y-3 text-sm text-white/70">
              {head && (
                <p className="flex items-start gap-2.5 leading-relaxed">
                  <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-white/50" />
                  <span>{stripTags(bodyOf(head))}</span>
                </p>
              )}
              {linkedContacts.map((item) => {
                const link = item.attributes.link!.trim();
                const whatsapp = link.includes('wa.me');
                const Icon = whatsapp ? MessageCircle : Mail;
                return (
                  <a
                    key={item.id}
                    href={link}
                    target={link.startsWith('http') ? '_blank' : undefined}
                    rel={link.startsWith('http') ? 'noopener noreferrer' : undefined}
                    title={item.attributes.title}
                    className="flex items-start gap-2.5 transition-colors hover:text-white"
                  >
                    <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-white/50" />
                    <span className="[overflow-wrap:anywhere]">{stripTags(bodyOf(item))}</span>
                  </a>
                );
              })}
            </div>
            {head?.attributes.map?.trim() && (
              <a
                href={head.attributes.map}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-white hover:underline"
              >
                <MapPin className="size-3.5" />
                {ui.openMap}
              </a>
            )}
          </div>

          <div>
            <h2 className="text-sm font-semibold tracking-tight text-white">{ui.followUs}</h2>
            <SocialLinks locale={locale} />
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6">
          <p className="text-xs text-white/60 sm:text-sm">{copy}</p>
        </div>
      </div>
    </footer>
  );
}
