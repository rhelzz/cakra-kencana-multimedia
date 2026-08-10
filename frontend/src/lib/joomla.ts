import { DEFAULT_LOCALE, JOOMLA_LANG, type Locale } from '@/lib/i18n';

// Server-only: token must never reach the browser.
export async function joomla<T = unknown>(path: string, revalidate = 60): Promise<T> {
  const res = await fetch(`${process.env.JOOMLA_API}${path}`, {
    headers: {
      Accept: 'application/vnd.api+json',
      'X-Joomla-Token': process.env.JOOMLA_TOKEN!,
    },
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`Joomla ${res.status} ${path}: ${await res.text()}`);
  const { data } = await res.json();
  return data as T;
}

/** Joomla's public web root, derived from the API URL — for files served straight from media. */
export const mediaUrl = (path: string) =>
  `${process.env.JOOMLA_API!.replace(/\/api\/index\.php\/v1\/?$/, '')}/${path.replace(/^\//, '')}`;

export type Article = {
  id: number;
  attributes: {
    title: string;
    alias: string;
    language?: string;
    text?: string;
    introtext?: string;
    articletext?: string;
    // Joomla already returns absolute URLs here.
    images?: {
      image_intro?: string;
      image_intro_alt?: string;
      image_fulltext?: string;
      image_fulltext_alt?: string;
    };
    // Custom fields land at top level under their own name; a list field arrives as { value: label }.
    icon?: Record<string, string> | string;
    map?: string;
    link?: string;
  };
};

type MenuItem = {
  id: string;
  attributes: {
    title: string;
    link: string;
    type: string;
    published: number;
    level: number;
    language: string;
  };
};

/** Published top-level items of the site's Main Menu for one language. */
export async function getMenu(locale: Locale) {
  const lang = JOOMLA_LANG[locale];
  const items = await joomla<MenuItem[]>('/menus/site/items');
  return items
    .filter(
      (i) =>
        i.attributes.published === 1 &&
        i.attributes.level === 1 &&
        (i.attributes.language === lang || i.attributes.language === '*'),
    )
    .map((i) => ({ id: i.id, title: i.attributes.title, href: hrefFor(i.attributes) }));
}

function hrefFor({ type, link }: MenuItem['attributes']) {
  if (type === 'url') return link; // "#about", "https://…"
  // Joomla's Home item is a component item pointing at the article list. On a one-page site
  // that's the hero, so send it to the top anchor instead of re-navigating to the route.
  return '#top';
}

/**
 * Joomla forbids the same alias twice in a category, so each translation carries a language
 * suffix ("service-road-signs-id"). The alias without it identifies the translation set.
 */
export const baseAlias = (alias: string) => alias.replace(/-(id|en|zh)$/, '');

/**
 * One article per translation set, preferring the requested language and falling back to
 * Indonesian — so a page never goes blank because a translation is missing. Articles with
 * no language ("*", e.g. logos) are shared by every locale.
 */
function pickTranslations(articles: Article[], locale: Locale) {
  const want = JOOMLA_LANG[locale];
  const fallback = JOOMLA_LANG[DEFAULT_LOCALE];
  const chosen = new Map<string, Article>();

  for (const article of articles) {
    const key = baseAlias(article.attributes.alias);
    const lang = article.attributes.language;
    const current = chosen.get(key);
    if (!current) {
      chosen.set(key, article);
      continue;
    }
    const rank = (l?: string) => (l === want ? 0 : l === '*' ? 1 : l === fallback ? 2 : 3);
    if (rank(lang) < rank(current.attributes.language)) chosen.set(key, article);
  }
  return [...chosen.values()];
}

/**
 * One article by its base alias. Joomla's list endpoint has no alias filter, so we filter
 * here — and must raise the page limit, because the default 20 silently hides articles
 * once the site grows past a single page.
 */
export async function getArticle(alias: string, locale: Locale) {
  const all = await joomla<Article[]>('/content/articles?page[limit]=200');
  const matches = all.filter((a) => baseAlias(a.attributes.alias) === alias);
  return pickTranslations(matches, locale)[0] ?? null;
}

/** Articles of one category, in the order an editor dragged them into. */
export async function getCategory(catid: number, locale: Locale) {
  // One request for every language: filtering server-side would drop "*" articles, and
  // the fallback needs to see the Indonesian rows anyway.
  // ponytail: single page of 200; add page[offset] paging if a category ever outgrows it.
  const all = await joomla<Article[]>(
    `/content/articles?filter[category]=${catid}&list[ordering]=ordering&list[direction]=asc&page[limit]=200`,
  );
  return pickTranslations(all, locale);
}

/** A translated section heading, stored as a tiny article in the Headings category. */
export async function getHeading(key: string, locale: Locale) {
  const article = await getArticle(`heading-${key}`, locale);
  return article?.attributes.title ?? '';
}

/** The site name from Joomla's global configuration (System → Global Configuration). */
export async function getSiteName() {
  const rows = await joomla<{ attributes: Record<string, unknown> }[]>(
    '/config/application?page[limit]=100',
  );
  const row = rows.find((r) => typeof r.attributes.sitename === 'string');
  return (row?.attributes.sitename as string) ?? '';
}

/** Category ids, so components don't carry magic numbers. */
export const CATEGORY = {
  about: 9,
  gallery: 8,
  services: 10,
  customers: 11,
  offices: 12,
  social: 13,
} as const;

/** The named entities TinyMCE actually emits. Anything else falls through untouched. */
const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  copy: '©',
  reg: '®',
  trade: '™',
  deg: '°',
  middot: '·',
  bull: '•',
  hellip: '…',
  ndash: '–',
  mdash: '—',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  times: '×',
  euro: '€',
  pound: '£',
};

/** A Joomla list field arrives as { value: label }; a plain field as a string. */
export function fieldValue(field: unknown): string | undefined {
  if (typeof field === 'string') return field.trim() || undefined;
  return field ? Object.keys(field as object)[0] : undefined;
}

/**
 * HTML → plain text for React text nodes. Entities must be decoded here: React escapes
 * whatever it renders, so a leftover "&amp;" would reach the visitor as literal "&amp;".
 */
export const stripTags = (html = '') =>
  html
    // Batas blok jadi spasi lebih dulu; tanpa ini "No. 11</p><p>Telp" menempel jadi "No. 11Telp".
    // Hanya tag blok — mengganti tag inline juga akan menyisipkan spasi di tengah kalimat.
    .replace(/<br\s*\/?>|<\/(?:p|li|div|h[1-6]|tr|td)>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[name.toLowerCase()] ?? match)
    .replace(/\s+/g, ' ')
    .trim();

/** Joomla appends "#joomlaImage://…" metadata to media URLs. Browsers ignore it; next/image won't. */
export const cleanImage = (url?: string) => url?.split('#')[0];

/**
 * Whichever image slot the editor actually filled — Intro Image or Full Article Image.
 * Must be `||`, not `??`: Joomla returns "" for an unset slot, never undefined, so `??`
 * would keep the empty string and the image would silently never render.
 */
export const imageOf = (a: Article) =>
  cleanImage(a.attributes.images?.image_intro || a.attributes.images?.image_fulltext);

/** Alt text from whichever slot has it, falling back to the article title. */
export const imageAltOf = (a: Article) =>
  a.attributes.images?.image_intro_alt ||
  a.attributes.images?.image_fulltext_alt ||
  a.attributes.title;

/** Pull the <li> texts out of an article written as a bullet list in the Joomla editor. */
export const listItems = (html = '') =>
  [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m) => stripTags(m[1]));

/** The body an editor typed, whichever field Joomla put it in. */
export const bodyOf = (a: Article) =>
  a.attributes.introtext || a.attributes.text || a.attributes.articletext || '';
