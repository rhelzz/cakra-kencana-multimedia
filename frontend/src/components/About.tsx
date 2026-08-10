import { CircleCheck } from 'lucide-react';
import { bodyOf, CATEGORY, cleanImage, getCategory, listItems, type Article } from '@/lib/joomla';
import { t, type Locale } from '@/lib/i18n';
import { Gallery, type Slide } from '@/components/Gallery';

export default async function About({ locale }: { locale: Locale }) {
  const [blocks, gallery] = await Promise.all([
    getCategory(CATEGORY.about, locale),
    getCategory(CATEGORY.gallery, locale),
  ]);

  if (blocks.length === 0) return null;

  const slides: Slide[] = gallery.flatMap((a) => {
    const src = cleanImage(a.attributes.images?.image_intro ?? a.attributes.images?.image_fulltext);
    return src
      ? [{ id: a.id, src, alt: a.attributes.images?.image_fulltext_alt || a.attributes.title }]
      : [];
  });

  return (
    <section id="about" className="scroll-mt-16 bg-background px-4 py-20 sm:px-6 lg:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {t(locale).aboutEyebrow}
          </p>
          <div className="mt-6 space-y-10">
            {blocks.map((block) => (
              <Block key={block.id} article={block} />
            ))}
          </div>
        </div>

        <Gallery slides={slides} />
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
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{article.attributes.title}</h2>
      {items.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-3 text-[0.95rem]">
              <CircleCheck className="mt-0.5 size-[1.15rem] shrink-0 text-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div
          className="mt-3 max-w-prose text-[0.95rem] leading-relaxed text-muted-foreground [&_p]:mt-3"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
}
