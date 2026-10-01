import { ArrowUpRight, FileText, Mail, MessageCircle } from 'lucide-react';
import { baseAlias, bodyOf, CATEGORY, getCategory, getHeading, stripTags } from '@/lib/joomla';
import { t, type Locale } from '@/lib/i18n';

export default async function Contact({ locale }: { locale: Locale }) {
  const [items, heading] = await Promise.all([
    getCategory(CATEGORY.contact, locale),
    getHeading('contact', locale),
  ]);
  const request = items.find((item) => baseAlias(item.attributes.alias) === 'request-compro');
  const hasRequest = Boolean(request?.attributes.link);
  const ui = t(locale);
  const contacts = items.filter(
    (item) => item !== request && item.attributes.link?.trim(),
  );

  if (contacts.length === 0 && !hasRequest) return null;

  return (
    <section id="contact" className="scroll-mt-20 border-t border-border bg-muted/30 px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <h2 className="reveal max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {heading}
        </h2>
        <span aria-hidden className="reveal mt-5 block h-1 w-14 rounded-full bg-primary" />

        <div className={hasRequest ? 'mt-12 grid gap-6 lg:grid-cols-[3fr_1fr]' : 'mt-12'}>
          <ul
            className={
              hasRequest
                ? 'reveal-stagger grid gap-4 sm:grid-cols-2'
                : 'reveal-stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-4'
            }
          >
            {contacts.map((item) => {
              const link = item.attributes.link!.trim();
              const whatsapp = link.includes('wa.me');
              const Icon = whatsapp ? MessageCircle : Mail;

              return (
                <li key={item.id}>
                  <a
                    href={link}
                    target={link.startsWith('http') ? '_blank' : undefined}
                    rel={link.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="group flex h-full flex-col items-start rounded-xl border border-border bg-background p-5 transition duration-500 ease-settle hover:-translate-y-1 hover:border-primary/50 hover:shadow-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                  >
                    <span className="flex w-full items-start gap-4">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-primary">
                        <Icon className="size-4.5" />
                      </span>
                      <span className="min-w-0">
                        <strong className="block text-sm font-medium">{item.attributes.title}</strong>
                        <span className="mt-1 block text-sm text-muted-foreground [overflow-wrap:anywhere]">
                          {stripTags(bodyOf(item))}
                        </span>
                      </span>
                    </span>
                    <span className="mt-5 inline-flex items-center gap-2 rounded-md bg-accent px-3 py-2 text-xs font-medium text-primary transition-colors duration-300 ease-exit group-hover:bg-primary group-hover:text-primary-foreground">
                      {whatsapp ? ui.contactWhatsapp : ui.contactEmail}
                      <ArrowUpRight className="size-3.5 transition-transform duration-500 ease-settle group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>

          {request?.attributes.link && (
            <div className="reveal relative self-start overflow-hidden bg-foreground p-6 text-background">
              <span aria-hidden className="pattern-diagonal absolute inset-0 opacity-30" />
              <div className="relative flex flex-col items-start">
                <FileText className="size-8 text-primary" />
                <p className="mt-6 max-w-sm text-sm leading-relaxed text-background/70">
                  {stripTags(bodyOf(request))}
                </p>
                <a
                  href={request.attributes.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition duration-500 ease-settle hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 motion-reduce:transition-none"
                >
                  {request.attributes.title}
                  <ArrowUpRight className="size-4" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
