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
│   │   └── services/[id]/page.tsx  Service detail
│   └── api/revalidate/route.ts   Webhook target for the Joomla plugin
├── components/
│   ├── Navbar.tsx → SiteHeader.tsx   server fetch → client shell (scroll state, sheet)
│   ├── Hero / About / Services / Customers / Offices / Footer   section components
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
| 10 | Services | 9 services | Services, service detail |
| 11 | Our customers | 6 client logos | Customers |
| 12 | Our offices | 4 locations | Offices, Footer |
| 13 | Social | 5 social accounts | SocialLinks |
| 14 | Headings | translated section headings | `getHeading()` |

### Custom fields (Content → Fields)

| Field | Type | Assigned to | Purpose |
|---|---|---|---|
| `icon` | list | Services, Offices, Social | 23 curated options; value must match a key in `lib/icons.ts` or `BRAND_PATHS` in `lib/social.ts` |
| `map` | url | Offices | Google Maps link. **Empty = the Open Map button disappears** |
| `link` | url | Social | Profile URL. **Empty = that icon disappears** |

Adding an icon option takes two edits: import it in `lib/icons.ts` **and** add the same
value in the Joomla field. That two-step is the deliberate price of a curated list — see §6.

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

1. requested language → 2. `*` (language-neutral) → 3. Indonesian → 4. anything else

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
- **The white plate behind the logo** keeps a dark full-colour logo legible over the hero photo
  and in dark mode. Drop it if a transparent white/mono logo is supplied.
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
| Default page size is **20** | Every list call passes `page[limit]=200`. This already caused the hero to vanish once the site passed 20 articles |
| Alias must be unique per category, **language is not part of the key** | The `-id`/`-en`/`-zh` suffix convention |
| `PATCH /menus/site/items/{id}` returns **500**, always | Menu items must be edited in the admin UI, or via direct SQL |
| Writing `urls.targeta` as `_blank` is rejected | It expects a numeric code |
| POST/PATCH require `Accept: application/vnd.api+json` | Otherwise "Could not match accept header" |
| Media URLs come back with a `#joomlaImage://…` fragment | `cleanImage()` strips it |
| TinyMCE emits HTML entities | `stripTags()` decodes them; React would otherwise print `&amp;` literally |

---

## 9. Built so far

Home page sections, all dynamic, all three languages:

1. **Hero** — title, subtitle, background image from article `home-hero`
2. **About** — 3 blocks from category 9 + a 4-slide autoplay carousel from category 8
3. **Services** — 9 cards with icons; each links to a detail page
4. **Our customers** — 6 logos on a permanently dark band
5. **Our offices** — 4 locations, icon per type, Open Map only when a link exists
6. **Footer** — logo, tagline, social icons, menu, head office, `{year}` copyright

Plus: **service detail page** (`/services/[id]`, icon + title + body + 8 sibling services +
per-service metadata + 404 on a bad id), sticky navbar that floats over the hero and turns
solid on scroll, mobile sheet menu, light/dark toggle, language switcher, smooth in-page
scrolling that respects `prefers-reduced-motion`, and per-locale `hreflang`.

## 10. Known gaps

- **Carousel images are ~7.6 MB total.** Not compressed yet. Resize to ~1600px / WebP when it matters.
- **`hreflang` uses relative paths.** Add `metadataBase` in `[locale]/layout.tsx` once the
  production domain exists.
- **Chinese and Indonesian copy was machine-written** and has never been reviewed by a native
  speaker. Printing terms especially (胶印, 丝网印刷, 车间).
- **Service detail pages are thin** — Joomla only has `introtext` filled. They become useful
  when editors write the part after "Read more".
- **Social URLs are placeholders** (`facebook.com/cakrakencanamultimedia` etc.).
- **Customer logos are other companies' trademarks**, used here as dummy content.
- **No tests, no CI, not a git repository.**
- `getArticle()` pulls up to 200 articles and filters in JS. Fine at this size; revisit if the
  article count grows by an order of magnitude.
