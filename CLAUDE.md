# Cakra Kencana Multimedia — company profile

Headless site: **Joomla 5.4.7 = backend/CMS only, Next.js 16 = the whole frontend.**
Joomla's own template is never rendered; Next talks to it over the Joomla Web Services API.

```
c:\laragon\www\company-profile\
├── backend/     Joomla 5.4.7  → http://company-profile.test/backend/
└── frontend/    Next.js 16.3  → http://localhost:3000
```

Every visible string and image comes from Joomla. Editors change content in the admin;
nobody redeploys. If you are about to hardcode copy or an image path, stop — check whether
it belongs in Joomla instead.

**Longer human-facing docs live in [`docs/`](docs/README.md)** (Indonesian — the audience is
the owner and the content team). This file is the condensed version for agents; `docs/` has
the per-section CRUD guide, the full Joomla customisation inventory, and the API reference.

**Content drafts live in `content-drafts/`** (`indonesian.md`, `english.md`, `mandarin.md`) —
staging files for the owner/content team to write real copy before it's imported into Joomla
by alias. Not rendered anywhere, not the source of truth once imported — Joomla admin is.
See §3 for the format.

---

## 1. Running it

| What | How |
|---|---|
| Joomla + MySQL | Start **Laragon** (nginx + MySQL). Both must be up or the frontend 500s. |
| Frontend | `cd frontend && npm run dev` → port 3000 |
| Joomla admin | http://company-profile.test/backend/administrator |
| API base | `http://company-profile.test/backend/api/index.php/v1` |
| DB | MySQL `joomla_db`, user `root`, no password, table prefix `n213k_` |

`frontend/.env.local` (not committed):

```
JOOMLA_API=http://company-profile.test/backend/api/index.php/v1
JOOMLA_TOKEN=<Joomla API token, Users → Manage → API Tokens>
REVALIDATE_SECRET=<shared with the Joomla plugin below>
```

**Use the `company-profile.test` vhost, not `localhost/company-profile/...`.** Only the vhost
has the nginx fix in §7.

Checks before calling anything done: `npx tsc --noEmit` and `npm run lint`. Both must be clean.

---

## 2. Frontend layout

```
frontend/src/
├── proxy.ts                      Locale routing (Next 16 renamed middleware → proxy)
├── app/
│   ├── globals.css               Tailwind v4 theme tokens + light/dark palette
│   ├── [locale]/
│   │   ├── layout.tsx            Root layout: <html lang>, fonts, ThemeProvider, Navbar, Footer
│   │   ├── page.tsx              Home = Hero + About + Services + Customers + Offices
│   │   ├── services/page.tsx     Service listing (all services, no limit)
│   │   └── services/[slug]/page.tsx Service detail: hero image + body + sub-service grid
│   └── api/revalidate/route.ts   Webhook target for the Joomla plugin
├── components/
│   ├── Navbar.tsx → SiteHeader.tsx   server fetch → client shell (scroll state, sheet)
│   ├── Hero / About / Services / Customers / Offices / Footer   section components
│   ├── ServiceCard.tsx           shared card, used by Services.tsx and services/page.tsx
│   ├── Gallery.tsx               carousel (client, autoplay)
│   ├── SocialLinks.tsx, LanguageSwitcher.tsx, ThemeToggle.tsx
│   └── ui/                       shadcn-generated — DO NOT hand-edit, excluded from lint
└── lib/
    ├── joomla.ts                 all API access + HTML helpers  ← read this first
    ├── i18n.ts                   locales, Joomla lang codes, UI label dictionary
    ├── icons.ts                  curated lucide map for the Joomla "Icon" field
    └── social.ts                 simple-icons brand marks
```

**Rule: the Joomla token never crosses to the client.** Data fetching lives in server
components; client components (`SiteHeader`, `Gallery`, `LanguageSwitcher`, `ThemeToggle`)
receive plain props only.

---

## 3. Joomla content model

Categories (ids are hardcoded in `CATEGORY` in `lib/joomla.ts` — do not renumber):

| id | Category | Holds | Rendered by |
|---|---|---|---|
| 2 | Uncategorised | `home-hero`, `footer-copyright` | Hero, Footer |
| 8 | Gallery | carousel slides (image only) | Gallery |
| 9 | About | the 3 text blocks | About |
| 10 | Services | 10 services (rewritten from the client's poster, no longer the original 9) | Services, `/services`, service detail |
| 11 | Our customers | 6 client logos | Customers |
| 12 | Our offices | 4 locations | Offices, Footer |
| 13 | Social | 5 social accounts | SocialLinks |
| 14 | Headings | translated section headings | `getHeading()` |
| 15 | Service sub-items | 86 sub-services (e.g. "Neon Box" under "Indoor / Outdoor Reklame") | sub-service grid on the service detail page |

### Custom fields (Content → Fields)

| Field | Type | Assigned to | Purpose |
|---|---|---|---|
| `icon` | list | Services, Offices, Social | 23 curated options; value must match a key in `lib/icons.ts` or `BRAND_PATHS` in `lib/social.ts` |
| `map` | url | Offices | Google Maps link. **Empty = the Open Map button disappears** |
| `link` | url | Social | Profile URL. **Empty = that icon disappears** |
| `parent-service` | list | Service sub-items (15) | Which of the 10 services this sub-item belongs to; value is the service's base alias (e.g. `service-digital-printing`). **Named `parent-service` with a hyphen, not `parent_service`** — Joomla slugified it on creation regardless of what was requested. Read via `attributes['parent-service']`, see `getSubServices()` in `joomla.ts`. |

Adding an icon option takes two edits: import it in `lib/icons.ts` **and** add the same
value in the Joomla field. That two-step is the deliberate price of a curated list — see §6.

### Services → Sub-services

```
Service (category 10)                       "Digital Printing"
  └── Sub-service (category 15)              "Roll Up Banner", "X Banner", … (26 of them)
```

Two levels only, by design — a sub-service does not get its own detail page, it's a card
(title + description, **no image**) in a masonry grid on its parent service's page. Matched by
`getSubServices(baseAlias(service.attributes.alias), locale)` filtering category 15 on the
`parent-service` field. Full rationale and the poster-derived content list are in
[`docs/10-rencana-restrukturisasi-layanan.md`](docs/10-rencana-restrukturisasi-layanan.md).

### Per-article conventions

- **About blocks**: a bullet list in the editor renders as a red checklist; anything else
  renders as prose. `listItems()` decides.
- **Section headings**: articles in category 14, alias `heading-<key>-<lang>`. `getHeading('services', locale)`.
  Headings are *not* category titles — a category has only one title and cannot be translated.
- **Footer copyright**: article `footer-copyright`, supports a `{year}` token.
- **Gallery / Customers / Social** articles are language `*` (shared by all locales) because
  they carry no translatable text. Their alt text is Indonesian only — known tradeoff.

---

## 4. Multilingual

Indonesian is primary and has **no URL prefix**.

```
/            → id-ID     (rewritten to /id internally by proxy.ts)
/en          → en-GB
/zh          → zh-CN
/id          → 308 redirect to /   (one canonical URL)
/fr          → 404
```

**Translation sets are linked by alias.** Joomla refuses the same alias twice in one
category regardless of language, so every article carries a language suffix:

```
service-road-signs-id     ← Indonesian (the spine)
service-road-signs-en
service-road-signs-zh
```

`baseAlias()` strips the suffix; `pickTranslations()` picks per item with this priority:

1. requested language → 2. `*` (language-neutral) → 3. Indonesian → 4. **nothing**

**Detail URLs use the base alias, never the article id.** Joomla gives each translation of a
set its own id (238 / 479 / 575 for one service), so an id in the URL only resolves in the
language it was created for — the language switcher, which swaps the locale prefix and keeps
the rest of the path, therefore 404'd on every service detail page. `serviceSlug()` in
`joomla.ts` returns the base alias with the `service-` prefix stripped, and the route is
`[slug]`. Match by comparing `serviceSlug()`, never by rebuilding an alias from a slug: an
article that breaks the naming convention then fails to match instead of matching the wrong one.

**Order follows the Indonesian spine, not the API's.** Joomla assigns every translation its own
`ordering` when it is created, so sorting on that made `/en` and `/zh` list services in a
different order from `/` — and reshuffled it again on every import. `pickTranslations()` now
takes the position of each item's Indonesian (or `*`) article and applies it to every locale.

**Translations are imported, not hand-entered:** `python scripts/import-translations.py --apply`
reads `content-drafts/`, matches indonesian.md to Joomla **by title** and to the other drafts
**by position** (their headings are translated, so there is nothing else to match on), and
refuses to run if the three files are out of sync. It is idempotent — an existing alias is
PATCHed. It also repairs the two silent Joomla quirks in §8 and verifies both afterwards.

There is deliberately no "any other language" rung: showing Chinese to an Indonesian visitor
is a leak, not a fallback. An item with none of the three simply does not exist for that
locale — which is also what makes unpublishing the Indonesian article remove it from `/`.

Fallback is **per item, not per page** — a missing Chinese article shows only that one block
in Indonesian. Joomla Associations are not used and not needed.

Menu items are per-language too (`Menus → Main Menu`, each item tagged with a language).
`getMenu(locale)` returns items matching the locale plus `*`.

**Interface labels live in code**, in the `UI` dictionary in `lib/i18n.ts`: "Selengkapnya",
"Buka Peta", "Tentang kami", "Menu", "Navigasi", "Layanan lainnya". Reason: if they lived in
Joomla, one untranslated article would leave a button blank. Editorial content goes in
Joomla, chrome goes in code.

---

## 5. Caching and instant updates

`joomla()` fetches with `next: { revalidate: 60 }`. Cache Components is **off**, so the
previous caching model applies — do not "modernise" this to `use cache` without reading
`node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md`.

60 seconds would be the visible delay, so a Joomla plugin removes it:

```
Save in Joomla admin
  → plg_system_nextrevalidate  (onContentAfterSave / onContentAfterDelete /
                                onContentChangeState / onExtensionAfterSave)
  → POST http://localhost:3000/api/revalidate?secret=…
  → revalidatePath('/', 'layout')
```

Plugin source: `backend/plugins/system/nextrevalidate/`. It was registered by inserting a
row in `n213k_extensions` (no installer package). Its URL and secret are plugin **params**,
editable at **System → Plugins → Next Revalidate** — change the port there, not in code.
Timeout is 5s so a dead frontend can never block saving.

Measured end to end: ~3.3s from save to updated page.

---

## 6. Decisions with a rationale (do not silently undo)

- **Icons: curated map, not `lucide-react/dynamic`.** Lucide's own docs advise against the
  dynamic component because it bundles every icon at build time. 23 hand-picked options also
  beat 1500 for an editor. Cost: adding one takes two edits.
- **Brand icons from `simple-icons`.** Lucide 1.30 removed all brand icons for trademark
  reasons. **LinkedIn is absent from simple-icons** (removed at LinkedIn's request) and falls
  back to a globe.
- **Customer logos are flattened white** with `brightness-0 invert` on a dark band, so mixed
  brand colours read as one set. This only works on wordmark/outline logos — a filled block
  with knockout text becomes a white blob (this happened with Indosat Ooredoo).
- **Images use plain `<img>`, not `next/image`.** Sources are runtime Joomla URLs; `next/image`
  would need `remotePatterns` for the Joomla host. Add it if optimisation becomes worth it.
- **Hero background is a CSS `background-image`**, so no image config is needed at all.
- **The navbar mark cross-fades: type over the hero, logo once solid.** The dark full-colour
  logo never read over the hero photo, so while the bar is transparent the mark is the site
  name as white type (`getSiteName()`, from Joomla Global Configuration — not a string in the
  component). Both are always rendered, stacked in one grid cell and toggled by opacity, so
  the link width never jumps. The `<img>` is `alt=""` (decorative); the always-present text
  names the link. No plate behind the logo — the PNG is transparent, so navbar/footer render
  it bare at its own aspect ratio. Footer is `h-16 w-auto`. Downscaling the 731×341 source
  was tried and reverted — it made nothing better. The logo looked rough because it was
  *rendered* at 40px: its "KENCANA MULTIMEDIA" wordmark is ~8% of the image height, so below
  ~48px it falls under the legibility floor no matter how the pixels are resampled.
  **The navbar shrinks on scroll** (FAASRI pattern): `h-24 md:h-32` while it floats transparent
  over the hero, then `h-16` + solid once past ~60% of the viewport. Because the logo is
  `h-full`, it shrinks with the bar for free — one size class, nothing to keep in sync. The
  trigger is `innerHeight * 0.6`, not a pixel count, since the hero is sized in `svh`.
  Known risk: the navy wordmark is dark-on-dark over the hero photo and in dark mode. Ask the
  client for a white/mono variant if it reads badly.
- **Two easing curves, site-wide, and no others.** `--ease-settle` (`cubic-bezier(0.22, 1, 0.36, 1)`)
  for anything that moves — indents, lifts, slides, growing rules. `--ease-exit` for colour and
  opacity. Tailwind's default curve applied uniformly at one duration is what makes an interface
  read as mechanical; the first pass at `/services` did exactly that and the hover felt stiff.
  Transforms run ~500ms on `ease-settle`, colour ~200-300ms on `ease-exit`. Do not introduce a
  third curve without a reason.
- **Measure changes with the job on the service detail page.** `max-w-6xl` for the header band,
  the sub-service masonry and the sibling list; `max-w-5xl` for the hero image; `max-w-3xl` for
  prose only, because a paragraph is uncomfortable past ~65 characters however wide the page is.
  The page previously ran at `max-w-3xl` top to bottom, and that single unchanging width was
  what made it read as flat. The hero image is pulled up over the header edge with a negative
  margin — that is why the header carries the extra bottom padding; change one and change both.
- **`.pattern-diagonal` is a content choice, not decoration.** Diagonal hairlines are the visual
  language of signage and print — cutting marks, safety banding, registration guides — so the
  `/services` header says what the company does without another photograph. It only works
  faded: the `mask-image` is half the utility, and at more than ~8% opacity it stops reading as
  paper stock and starts shouting.
- **Hover states stay restrained.** A full-width colour wash across a `/services` row was tried
  and rejected — at that scale it reads as loud, not premium. The pattern is: a hairline of red
  drawing along the row's own edge, a near-invisible ground, and a few pixels of indent.
- **Scroll reveals are CSS-only** (`.reveal` / `.reveal-stagger` in `globals.css`), driven by
  `animation-timeline: view()` — no IntersectionObserver, no state, and crucially no
  `'use client'` leaking into the server components that render the sections. The un-animated
  state is the **default** and the animation is layered on inside
  `@supports (animation-timeline: view())`, so a browser without scroll timelines (Firefox as
  of now) shows the content normally instead of stranding it at `opacity: 0`. Stagger is a
  per-item `animation-range`, not a scheduled delay: `--reveal-i` on `nth-child` stretches each
  item's range a little further than the last. Do not "fix" this by adding a JS reveal library.
  **`animation-fill-mode` is `backwards`, never `both`** — a running animation outranks normal
  declarations, so a forwards fill keeps owning `transform` after the reveal ends and silently
  kills every `hover:-translate-y-*` on the same element. This already broke the service-card
  hover lift once.
- **`scroll-mt-20` on every anchor target, and `pt-20` on every non-home `<main>`, must match
  the solid navbar height** (`h-20`). If the navbar height changes, these change with it or
  in-page links land under the header and page headings sit behind the bar.
- **`/services` is a one-per-row zig-zag list, not the home page's card grid.** Ten entries that
  all matter equally get skimmed in a grid; alternating the side each row enters from and sits
  on forces the eye to reset per item. It uses `.reveal-alternate`, whose scroll-linked
  `view()` timeline replays in reverse when you scroll back up — that is free, and is why there
  is no "already animated" flag anywhere. The container needs `overflow-x-clip` or the ±3.5rem
  horizontal travel adds a page-wide horizontal scrollbar on narrow screens.
- **`src/components/ui/**` is excluded from ESLint** — generated by the shadcn CLI, and its
  carousel violates `react-hooks/set-state-in-effect`.
- **shadcn uses Base UI, not Radix.** Composition is `render={<Button/>}`, **not** `asChild`.
- **Fonts**: Poppins only, weights 300/400/500/600/700 listed explicitly (not a variable font
  on Google Fonts — an unlisted weight gets faked and looks wrong). No mono font is shipped.
  In `globals.css`, `@theme inline` needs **literal** family names; `var(--font-poppins)` there
  resolves to nothing because Tailwind v4 resolves it at parse time.

---

## 7. Environment gotchas that cost real time

- **nginx PATH_INFO.** `location ~ \.php$` never matches `/api/index.php/v1/...`, so every API
  call 404s before reaching PHP. Fixed to `\.php(/|$)` in
  `C:\laragon\etc\nginx\sites-enabled\company-profile.test.conf`. The Laragon-generated
  `auto.` file was renamed to `.bak` so it does not overwrite the fix. **If the API suddenly
  404s everywhere, check this file first.**
- **Joomla PSR-4 autoload cache.** After adding a plugin, delete
  `backend/administrator/cache/autoload_psr4.php` or you get "Class not found".

## 8. Joomla API quirks discovered the hard way

| Quirk | Consequence |
|---|---|
| Custom field values appear at **top level under the field name**, list fields as `{value: label}` | `fieldValue()` exists for this |
| `urls` (Link A/B/C) is returned by the **single-article** endpoint but **not by the list** | Map links moved to a custom field |
| `catid` and `ordering` are not in the article response at all | Fetch by category instead of by id; the service detail page finds its article inside the category list |
| Default page size is **20**, and any single `page[limit]` is a silent ceiling | `getCategory()` goes through `joomlaPaged()`, which follows `page[offset]` until the pages run out. A fixed limit has failed twice: the hero vanished past 20 articles, then the sub-service grid emptied on `/` when category 15 hit 258 rows (86 × 3 languages) against a limit of 200. Every new locale multiplies every category |
| Alias must be unique per category, **language is not part of the key** | The `-id`/`-en`/`-zh` suffix convention |
| `PATCH /menus/site/items/{id}` returns **500**, always | Menu items must be edited in the admin UI, or via direct SQL |
| Writing `urls.targeta` as `_blank` is rejected | It expects a numeric code |
| POST/PATCH require `Accept: application/vnd.api+json` | Otherwise "Could not match accept header" |
| Media URLs come back with a `#joomlaImage://…` fragment | `cleanImage()` strips it |
| TinyMCE emits HTML entities | `stripTags()` decodes them; React would otherwise print `&amp;` literally |
| `POST /content/categories` and `POST /fields/{context}` reply HTTP 500 **even when they succeed** | Never trust the status code for these two endpoints — verify with `GET` or the DB |
| `assigned_cat_ids` in a field's POST body is silently ignored | The field saves but isn't attached to any category. Insert the row into `#__fields_categories` (`field_id`, `category_id`) directly |
| Articles created via `POST /content/articles` get **no row in `#__workflow_associations`**, so they never appear in any `GET /content/articles` response (not a `filter[state]` issue — they're excluded from the join entirely) | After seeding, run: `INSERT INTO n213k_workflow_associations (item_id, stage_id, extension) SELECT c.id, 1, 'com_content.article' FROM n213k_content c LEFT JOIN n213k_workflow_associations wa ON wa.item_id=c.id AND wa.extension='com_content.article' WHERE wa.item_id IS NULL AND c.catid IN (<your categories>);` |
| `com_fields` in the POST/PATCH body **has stopped writing custom field values** in this environment (confirmed against the exact example that used to work) | Verify `#__fields_values` after every create; if empty, `INSERT INTO n213k_fields_values (field_id, item_id, value) VALUES (…)` directly |

---

## 9. Built so far

Home page sections, all dynamic, all three languages:

1. **Hero** — title, subtitle, background image from article `home-hero`
2. **About** — 3 blocks from category 9 + a 4-slide autoplay carousel from category 8
3. **Services** — up to 6 cards with icons on the home page; a **"Lebih banyak" button** appears
   and links to `/services` (full listing, no limit) once there are more than 6. Each card links
   to a detail page.
4. **Our customers** — 6 logos on a permanently dark band
5. **Our offices** — 4 locations, icon per type, Open Map only when a link exists
6. **Footer** — logo, tagline, social icons, menu, head office, `{year}` copyright

Plus: **`/services`** (listing page, all 10 services), **service detail page** (`/services/[id]`,
icon + title + hero image + body + a masonry grid of that service's sub-services, text-only
cards, no per-sub-service image + 9 sibling services + per-service metadata + 404 on a bad id),
sticky navbar that floats transparent over the home page hero and turns solid on scroll —
**solid immediately on every other page**, since only the home page has a dark hero to float
over (`SiteHeader.tsx`: `scrolled = scrolledPast || !atHome`) — mobile sheet menu, light/dark
toggle, language switcher, smooth in-page scrolling that respects `prefers-reduced-motion`, and
per-locale `hreflang`.

## 10. Known gaps

- **Carousel images are ~7.6 MB total.** Not compressed yet. Resize to ~1600px / WebP when it matters.
- **`hreflang` uses relative paths.** Add `metadataBase` in `[locale]/layout.tsx` once the
  production domain exists.
- **Chinese and Indonesian copy was machine-written** and has never been reviewed by a native
  speaker. Printing terms especially (胶印, 丝网印刷, 车间).
- **Service detail pages are thin** — Joomla only has `introtext` filled. They become useful
  when editors write the part after "Read more".
- **Chinese service copy is machine-written and unreviewed.** All 10 services and 86
  sub-services now exist in all three languages, imported from `content-drafts/` by
  `scripts/import-translations.py`. The English reads naturally; the Mandarin printing terms
  (胶版印刷, 丝网印刷, 数码印刷) have never been checked by a native speaker.
- **YouTube and TikTok have no `link` value** — no official account found, so their icons are
  hidden by design. Instagram, Facebook and WhatsApp use the company's real accounts.
- **Customer logos are other companies' trademarks**, used here as dummy content.
- **No tests, no CI.** Is a git repository now (was not when this file was first written).
