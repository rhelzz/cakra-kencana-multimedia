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

/**
 * Every row of a list endpoint, following `page[offset]` until the pages run out.
 *
 * A single `page[limit]` is not a safe way to read a category, because the failure mode is
 * silent: Joomla returns the first N rows and says nothing about the rest, so the site simply
 * stops showing some content. That has now bitten this project twice — first the hero vanished
 * when the site passed the default limit of 20, then the sub-service grid emptied out on `/`
 * when category 15 reached 258 articles (86 sub-services × 3 languages) against a limit of 200.
 * Translations multiply every category by the number of locales, so a fixed ceiling is only
 * ever a question of when.
 *
 * The page cap is a guard against an endpoint that ignores `page[offset]` and hands back the
 * same page forever; it is not a content limit, and 20 pages is 4000 articles.
 */
async function joomlaPaged<T>(path: string, pageSize = 200): Promise<T[]> {
  const rows: T[] = [];
  for (let page = 0; page < 20; page++) {
    const batch = await joomla<T[]>(
      `${path}&page[limit]=${pageSize}&page[offset]=${page * pageSize}`,
    );
    rows.push(...batch);
    if (batch.length < pageSize) return rows;
  }
  return rows;
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
    // Name has a hyphen because Joomla slugified "parent_service" itself when the field was made.
    'parent-service'?: Record<string, string> | string;
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
 * The URL segment for a service detail page.
 *
 * Deliberately NOT the article id: Joomla gives each translation of a set its own id
 * (238 / 479 / 575 for the same service), so an id in the URL only resolves in the language
 * it was created for — switching language on a detail page 404s. The base alias is the one
 * identity shared across a translation set, which is the same thing `pickTranslations()` and
 * `getSubServices()` key on. The `service-` prefix is dropped because it says nothing in a URL.
 *
 * Compare with this function rather than rebuilding an alias from a slug — that way an
 * article whose alias does not follow the convention simply never matches, instead of
 * matching the wrong thing.
 */
export const serviceSlug = (article: Article) =>
  baseAlias(article.attributes.alias).replace(/^service-/, '');

/**
 * One article per translation set, preferring the requested language and falling back to
 * Indonesian — so a page never goes blank because a translation is missing. Articles with
 * no language ("*", e.g. logos) are shared by every locale.
 */
function pickTranslations(articles: Article[], locale: Locale) {
  const want = JOOMLA_LANG[locale];
  const fallback = JOOMLA_LANG[DEFAULT_LOCALE];
  // Peringkat 3 = bahasa lain yang bukan bahasa utama. Itu BUKAN cadangan yang sah:
  // menampilkan Mandarin kepada pengunjung Indonesia lebih buruk daripada tidak menampilkan
  // apa-apa. Kalau sebuah item tidak punya versi yang diminta, versi netral, maupun versi
  // Indonesia, berarti item itu memang tidak punya isi untuk locale ini.
  const rank = (l?: string) => (l === want ? 0 : l === '*' ? 1 : l === fallback ? 2 : 3);
  const chosen = new Map<string, Article>();

  // Urutan mengikuti tulang punggung: posisi artikel Indonesia (atau "*") yang menentukan,
  // bukan artikel mana yang kebetulan muncul lebih dulu di respons API. Joomla memberi
  // `ordering` sendiri ke setiap terjemahan saat dibuat, jadi tanpa ini /en dan /zh
  // menampilkan layanan dengan urutan yang berbeda dari / — dan urutan itu ikut berubah
  // setiap kali ada terjemahan baru ditambahkan.
  const spine = new Map<string, number>();
  for (const article of articles) {
    const lang = article.attributes.language;
    if (lang !== fallback && lang !== '*') continue;
    const key = baseAlias(article.attributes.alias);
    if (!spine.has(key)) spine.set(key, spine.size);
  }

  for (const article of articles) {
    if (rank(article.attributes.language) === 3) continue;
    const key = baseAlias(article.attributes.alias);
    const current = chosen.get(key);
    if (!current || rank(article.attributes.language) < rank(current.attributes.language)) {
      chosen.set(key, article);
    }
  }

  // Item tanpa versi Indonesia tidak punya posisi di tulang punggung; Array.sort stabil,
  // jadi item seperti itu tetap di urutan kemunculannya, di belakang yang punya.
  return [...chosen.entries()]
    .sort(([a], [b]) => (spine.get(a) ?? Infinity) - (spine.get(b) ?? Infinity))
    .map(([, article]) => article);
}

/**
 * One article by its base alias, scoped to the category it lives in.
 * ponytail: this used to scan all 200 articles site-wide and filter by alias in JS — cheap
 * at ~60 articles, but it silently lost home-hero once the sub-service seed pushed the site
 * past 200 total articles (Joomla's list order isn't by id, so old articles fall off the page).
 * Scoping to the caller's known category makes the result exact regardless of site size.
 */
export async function getArticle(alias: string, locale: Locale, catid: number) {
  const items = await getCategory(catid, locale);
  return items.find((a) => baseAlias(a.attributes.alias) === alias) ?? null;
}

/** Articles of one category, in the order an editor dragged them into. */
export async function getCategory(catid: number, locale: Locale) {
  // One request for every language: filtering server-side would drop "*" articles, and
  // the fallback needs to see the Indonesian rows anyway.
  // filter[state]=1 wajib: tanpa itu API mengembalikan artikel Unpublished juga, sehingga
  // konten yang sengaja disembunyikan editor tetap tayang. Trash (-2) memang sudah tersaring
  // sendiri, tapi Unpublished (0) dan Archived (2) tidak.
  const all = await joomlaPaged<Article>(
    `/content/articles?filter[category]=${catid}&filter[state]=1&list[ordering]=ordering&list[direction]=asc`,
  );
  return pickTranslations(all, locale);
}

/** A translated section heading, stored as a tiny article in the Headings category. */
export async function getHeading(key: string, locale: Locale) {
  const article = await getArticle(`heading-${key}`, locale, CATEGORY.headings);
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
  uncategorised: 2,
  about: 9,
  gallery: 8,
  services: 10,
  customers: 11,
  offices: 12,
  social: 13,
  headings: 14,
  serviceSubItems: 15,
} as const;

/** Sub-services of one service, matched via the `parent-service` field to the service's base alias. */
export async function getSubServices(parentAlias: string, locale: Locale) {
  const all = await getCategory(CATEGORY.serviceSubItems, locale);
  return all.filter((a) => fieldValue(a.attributes['parent-service']) === parentAlias);
}

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
