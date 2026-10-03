import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowUpRight,
  ChevronLeft,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Slash,
} from 'lucide-react';
import {
  baseAlias,
  bodyOf,
  CATEGORY,
  getArticle,
  getCategory,
  getHeading,
  listItems,
  pageHeaderImage,
  stripTags,
} from '@/lib/joomla';
import { isLocale, localePath, t, type Locale } from '@/lib/i18n';
import ContactForm from '@/components/ContactForm';

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/contact'>): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const head = await getArticle('heading-contact', locale, CATEGORY.headings);
  return { title: head?.attributes.title ?? '' };
}

export default async function ContactPage({ params }: PageProps<'/[locale]/contact'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;

  const [
    headArticle,
    formEyebrow,
    formTitle,
    formArticle,
    infoEyebrow,
    infoTitle,
    infoArticle,
    contacts,
    services,
    offices,
    hours,
    headers,
  ] = await Promise.all([
    getArticle('heading-contact', loc, CATEGORY.headings),
    // These heading articles don't exist in Joomla yet — getHeading falls back to ''
    // and the ui/heading fallbacks below keep the cards furnished until an editor adds them.
    getHeading('contact-form-eyebrow', loc),
    getHeading('contact-form', loc),
    getArticle('contact-form', loc, CATEGORY.contact),
    getHeading('contact-info-eyebrow', loc),
    getHeading('contact-info', loc),
    getArticle('contact-info', loc, CATEGORY.contact),
    getCategory(CATEGORY.contact, loc),
    getCategory(CATEGORY.services, loc),
    getCategory(CATEGORY.offices, loc),
    getArticle('working-hours', loc, CATEGORY.contact),
    getCategory(CATEGORY.pageHeaders, loc),
  ]);

  const headerBg = pageHeaderImage(headers, 'contact');

  const ui = t(loc);
  const base = localePath(loc) === '/' ? '' : localePath(loc);

  const heading = headArticle?.attributes.title ?? '';
  const headerDesc = headArticle ? stripTags(bodyOf(headArticle)) : '';

  const formDesc = formArticle ? stripTags(bodyOf(formArticle)) : '';
  const infoDesc = infoArticle ? stripTags(bodyOf(infoArticle)) : '';

  // working-hours carries no link, but exclude the non-contact articles explicitly so a
  // future editor link can't leak them into the linked rows.
  const nonContact = new Set(['working-hours', 'contact-form', 'contact-info']);
  const linked = contacts.filter(
    (item) => !nonContact.has(baseAlias(item.attributes.alias)) && item.attributes.link?.trim(),
  );
  const waFallback =
    linked.find((item) => item.attributes.link!.includes('wa.me'))?.attributes.link?.trim() ?? null;

  const head = offices.find((office) => baseAlias(office.attributes.alias) === 'office-head-office');
  const headAddress = head ? stripTags(bodyOf(head)) : '';
  const map = head?.attributes.map?.trim();
  const embedSrc = map ? `https://www.google.com/maps?q=${encodeURIComponent(map)}&output=embed` : null;
  const hoursItems = hours ? listItems(bodyOf(hours)) : [];

  // Plain data only — the SMTP token and Joomla token never leave the server.
  const serviceOptions = services.map((s) => ({
    value: baseAlias(s.attributes.alias),
    label: s.attributes.title,
  }));
  const mailConfigured = Boolean(process.env.SMTP_HOST && process.env.CONTACT_TO);

  return (
    // pt-20, not pt-16: the header is fixed and solid at `h-20` on every page but the home
    // page, so anything less tucks the first heading under the bar.
    <main id="main-content" className="flex-1 pt-20">
      <header className="relative isolate overflow-hidden border-b border-border bg-surface-container-low px-4 py-14 sm:px-6 lg:py-20">
        {/* Two layers, both fading out, so the band is furnished without becoming busy:
            the diagonal print rules give it texture and the bloom gives it a light source.
            Everything sits behind the content and neither tints a single glyph. */}
        {/* Custom header photo from Joomla (Page Headers category); the scrim
            keeps text readable while the band texture stays on top. */}
        {headerBg && (
          <>
            <div aria-hidden className="absolute inset-0 -z-20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={headerBg}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-gradient-to-r from-surface-container-low via-surface-container-low/85 to-surface-container-low/35"
            />
          </>
        )}
        <div
          aria-hidden
          className="pattern-diagonal pointer-events-none absolute inset-0 -z-10 opacity-[0.07]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 top-1/2 -z-10 size-96 -translate-y-1/2 rounded-full bg-primary opacity-10 blur-3xl"
        />
        {/* Solid gear silhouette echoing the logo mark (lucide only ships thin
            outlines), enlarged and cropped exactly in half by the viewport
            edge (header clips it). */}
        <div aria-hidden="true" className="pointer-events-none absolute -z-10 right-0 top-1/2 size-[720px] -translate-y-1/2 translate-x-1/2">
          <svg viewBox="-250 -250 500 500" className="size-full text-primary/[0.14]" fill="currentColor" fillRule="evenodd">
            <path d="M192.8,-35.4L238.3,-28.4L238.3,28.4L192.8,35.4L170.4,96.8L200.8,131.4L164.3,175.0L124.9,151.0L68.3,183.7L69.4,229.8L13.4,239.6L-1.4,196.0L-65.7,184.6L-94.5,220.6L-143.8,192.2L-127.0,149.3L-169.1,99.2L-214.2,108.2L-233.7,54.8L-193.3,32.7L-193.3,-32.7L-233.7,-54.8L-214.2,-108.2L-169.1,-99.2L-127.0,-149.3L-143.8,-192.2L-94.5,-220.6L-65.7,-184.6L-1.4,-196.0L13.4,-239.6L69.4,-229.8L68.3,-183.7L124.9,-151.0L164.3,-175.0L200.8,-131.4L170.4,-96.8ZM92.0,0.0L91.2,12.0L88.9,23.8L85.0,35.2L79.7,46.0L73.0,56.0L65.1,65.1L56.0,73.0L46.0,79.7L35.2,85.0L23.8,88.9L12.0,91.2L0.0,92.0L-12.0,91.2L-23.8,88.9L-35.2,85.0L-46.0,79.7L-56.0,73.0L-65.1,65.1L-73.0,56.0L-79.7,46.0L-85.0,35.2L-88.9,23.8L-91.2,12.0L-92.0,0.0L-91.2,-12.0L-88.9,-23.8L-85.0,-35.2L-79.7,-46.0L-73.0,-56.0L-65.1,-65.1L-56.0,-73.0L-46.0,-79.7L-35.2,-85.0L-23.8,-88.9L-12.0,-91.2L-0.0,-92.0L12.0,-91.2L23.8,-88.9L35.2,-85.0L46.0,-79.7L56.0,-73.0L65.1,-65.1L73.0,-56.0L79.7,-46.0L85.0,-35.2L88.9,-23.8L91.2,-12.0Z" />
          </svg>
        </div>

        <div className="mx-auto max-w-6xl">
          {/* Breadcrumb doubles as the way back. `aria-current="page"` marks the leaf, and the
              separators are decorative so a screen reader reads "Beranda, heading"
              rather than spelling out slashes. */}
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
              <li>
                <Link
                  href={base || '/'}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-background/70 py-1.5 pl-2.5 pr-3.5 font-medium text-muted-foreground backdrop-blur-sm transition duration-300 ease-settle hover:border-primary/50 hover:text-primary active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
                >
                  <ChevronLeft className="size-4 transition-transform duration-500 ease-settle group-hover:-translate-x-0.5 motion-reduce:transition-none" />
                  {ui.home}
                </Link>
              </li>
              <li aria-hidden className="text-border">
                <Slash className="size-3.5 -rotate-12" />
              </li>
              <li aria-current="page" className="font-medium text-foreground">
                {heading}
              </li>
            </ol>
          </nav>

          <div className="mt-10 grid items-center gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-12">
            <div>
              <p className="flex items-center gap-3 text-base font-bold uppercase tracking-[0.18em] text-primary">
                <span aria-hidden className="block h-1 w-12 rounded-full bg-primary" />
                {ui.contactUs}
              </p>
              <h1 className="mt-5 max-w-3xl text-balance text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl">
                {heading}
              </h1>
              {headerDesc && (
                <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
                  {headerDesc}
                </p>
              )}
            </div>
            {/* Decorative brand slogans — English in all locales, hidden from
                assistive tech so they never read as content. Each rides its
                own glass card so the gear and band texture behind can't wash
                the small caps out. */}
            <div
              aria-hidden="true"
              className="relative z-10 hidden grid-cols-2 gap-5 lg:grid lg:pl-2 lg:pr-10"
            >
              <div className="rounded-xl border border-border/60 bg-background/70 px-5 py-4 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase leading-[1.8] tracking-[0.14em] text-primary">
                  Good ideas
                  <br />
                  bring brands
                  <br />
                  to life
                </p>
                <span className="mt-4 block h-[3px] w-10 rounded-full bg-primary" />
              </div>
              <div className="self-start rounded-xl border border-border/60 bg-background/70 px-5 py-4 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase leading-[1.8] tracking-[0.14em] text-primary">
                  Ideas
                  <br />
                  production
                  <br />
                  real impact
                </p>
                <span className="mt-4 block h-[3px] w-10 rounded-full bg-primary" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="overflow-x-clip px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left: the form card. */}
            <div className="reveal rounded-xl border border-border bg-background p-6 sm:p-8">
              {(formEyebrow || ui.contactUs) && (
                <p className="flex items-center gap-3 text-base font-bold uppercase tracking-[0.18em] text-primary">
                  <span aria-hidden className="block h-1 w-12 rounded-full bg-primary" />
                  {formEyebrow || ui.contactUs}
                </p>
              )}
              <h2 className="mt-4 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
                {formTitle || heading}
              </h2>
              {formDesc && (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{formDesc}</p>
              )}
              <div className="mt-6">
                <ContactForm
                  services={serviceOptions}
                  mailConfigured={mailConfigured}
                  waFallback={waFallback}
                  locale={loc}
                  ui={ui}
                />
              </div>
            </div>

            {/* Right: the info card — linked rows reuse the home Contact row markup. */}
            <div className="reveal rounded-xl border border-border bg-background p-6 sm:p-8">
              {(infoEyebrow || ui.contactUs) && (
                <p className="flex items-center gap-3 text-base font-bold uppercase tracking-[0.18em] text-primary">
                  <span aria-hidden className="block h-1 w-12 rounded-full bg-primary" />
                  {infoEyebrow || ui.contactUs}
                </p>
              )}
              <h2 className="mt-4 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
                {infoTitle || heading}
              </h2>
              {infoDesc && (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{infoDesc}</p>
              )}

              <ul className="mt-6 divide-y divide-border border-y border-border">
                {linked.map((item) => {
                  const link = item.attributes.link!.trim();
                  const whatsapp = link.includes('wa.me');
                  const Icon = whatsapp ? MessageCircle : Mail;
                  return (
                    <li key={item.id}>
                      <a
                        href={link}
                        target={link.startsWith('http') ? '_blank' : undefined}
                        rel={link.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="group flex items-start gap-4 py-4 transition duration-300 ease-exit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
                      >
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-primary">
                          <Icon className="size-4.5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <strong className="block text-sm font-medium">{item.attributes.title}</strong>
                          <span className="mt-0.5 block text-sm text-muted-foreground [overflow-wrap:anywhere]">
                            {stripTags(bodyOf(item))}
                          </span>
                          <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                            {whatsapp ? ui.contactWhatsapp : ui.contactEmail}
                            <ArrowUpRight className="size-3.5 transition-transform duration-500 ease-settle group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none" />
                          </span>
                        </span>
                      </a>
                    </li>
                  );
                })}

                {head && headAddress && (
                  <li className="flex items-start gap-4 py-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-primary">
                      <MapPin className="size-4.5" />
                    </span>
                    <span className="min-w-0">
                      <strong className="block text-sm font-medium">{head.attributes.title}</strong>
                      <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">
                        {headAddress}
                      </span>
                    </span>
                  </li>
                )}

                {hours && hoursItems.length > 0 && (
                  <li className="flex items-start gap-4 py-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-primary">
                      <Clock className="size-4.5" />
                    </span>
                    <span className="min-w-0">
                      <strong className="block text-sm font-medium">{hours.attributes.title}</strong>
                      <ul className="mt-0.5 space-y-0.5">
                        {hoursItems.map((line) => (
                          <li key={line} className="text-sm text-muted-foreground">
                            {line}
                          </li>
                        ))}
                      </ul>
                    </span>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Full-width location: no dedicated headings exist, so this reuses the head-office
              record — its title, address, and map field are the whole section. */}
          {embedSrc && (
            <section
              aria-label={head?.attributes.title ?? ui.contactUs}
              className="reveal mt-6 overflow-hidden rounded-xl border border-border bg-background"
            >
              <div className="grid lg:grid-cols-[1fr_1.2fr]">
                <div className="p-6 sm:p-8">
                  <p className="flex items-center gap-3 text-base font-bold uppercase tracking-[0.18em] text-primary">
                    <span aria-hidden className="block h-1 w-12 rounded-full bg-primary" />
                    {ui.contactUs}
                  </p>
                  {head && (
                    <h2 className="mt-4 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
                      {head.attributes.title}
                    </h2>
                  )}
                  {headAddress && (
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                      {headAddress}
                    </p>
                  )}
                  {map && (
                    <a
                      href={map}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground transition duration-300 ease-settle hover:border-primary/50 hover:text-primary active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
                    >
                      <MapPin className="size-4" />
                      {ui.openMap}
                    </a>
                  )}
                </div>
                <iframe
                  title={head?.attributes.title ?? ui.contactUs}
                  src={embedSrc}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-72 w-full border-0 lg:h-full lg:min-h-80"
                />
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
