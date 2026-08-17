import { CircleCheck } from 'lucide-react';
import { bodyOf, CATEGORY, getCategory, imageAltOf, imageOf, listItems, type Article } from '@/lib/joomla';
import { t, type Locale } from '@/lib/i18n';
import { Gallery, type Slide } from '@/components/Gallery';

export default async function About({ locale }: { locale: Locale }) {
  const [blocks, gallery] = await Promise.all([
    getCategory(CATEGORY.about, locale),
    getCategory(CATEGORY.gallery, locale),
  ]);

  if (blocks.length === 0) return null;

  const slides: Slide[] = gallery.flatMap((a) => {
    const src = imageOf(a);
    return src ? [{ id: a.id, src, alt: imageAltOf(a) }] : [];
  });

  return (
    <section id="about" className="scroll-mt-20 bg-background px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="reveal flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <span aria-hidden className="h-px w-8 bg-primary" />
            {t(locale).aboutEyebrow}
          </p>
          <div className="reveal-stagger mt-6 space-y-10">
            {blocks.map((block) => (
              <Block key={block.id} article={block} />
            ))}
          </div>
        </div>

        <div className="reveal">
          <Gallery slides={slides} />
        </div>
      </div>
    </section>
  );
}

/** A block renders as a checklist when the editor wrote a bullet list, otherwise as prose. */
function Block({ article }: { article: Article }) {
  const html = bodyOf(article);
  const items = listItems(html);

  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
        {article.attributes.title}
      </h2>
      {items.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            // The checklist is the one place the red reads as a stamp of approval rather than
            // decoration, so the marker gets a tinted disc instead of sitting on bare page.
            <li key={item} className="group flex items-start gap-3 text-[0.95rem]">
              <span className="mt-0.5 grid size-[1.35rem] shrink-0 place-items-center rounded-full bg-accent transition-transform duration-500 ease-settle group-hover:scale-110 motion-reduce:transition-none">
                <CircleCheck className="size-[0.95rem] text-primary" />
              </span>
              <span className="text-pretty">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div
          className="mt-3 max-w-prose text-[0.95rem] leading-relaxed text-pretty text-muted-foreground [&_p]:mt-3"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
}
