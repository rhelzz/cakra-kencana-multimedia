# 07 — Frontend

Next.js 16.3, App Router, Turbopack, TypeScript, Tailwind v4, shadcn/ui.

> `frontend/AGENTS.md` mengingatkan: versi Next ini punya perubahan besar. Kalau ragu, baca
> dokumentasi yang ikut terpasang di `node_modules/next/dist/docs/`, bukan mengandalkan ingatan.

## Struktur

```
frontend/src/
├── proxy.ts                         routing bahasa (Next 16: middleware → proxy)
├── app/
│   ├── globals.css                  token tema + palet light/dark
│   ├── [locale]/
│   │   ├── layout.tsx               root layout: <html lang>, font, tema, Navbar, Footer
│   │   ├── page.tsx                 beranda
│   │   └── services/[id]/page.tsx   halaman detail layanan
│   └── api/revalidate/route.ts      webhook dari plugin Joomla
├── components/
│   ├── Navbar.tsx → SiteHeader.tsx  server (ambil data) → client (scroll, sheet)
│   ├── Hero / About / Services / Customers / Offices / Footer
│   ├── Gallery.tsx                  carousel (client)
│   ├── SocialLinks.tsx, LanguageSwitcher.tsx, ThemeToggle.tsx, theme-provider.tsx
│   └── ui/                          hasil generate shadcn — jangan disunting tangan
└── lib/
    ├── joomla.ts                    semua akses API + helper HTML
    ├── i18n.ts                      locale, kode bahasa Joomla, kamus label
    ├── icons.ts                     peta ikon lucide terkurasi
    └── social.ts                    ikon brand simple-icons
```

## Aturan server vs client

**Server Component (default).** Semua yang mengambil data. Token tidak pernah menyeberang.

**Client Component** (`'use client'`) hanya empat, semuanya karena butuh interaksi browser:

| Komponen | Kenapa harus client |
|---|---|
| `SiteHeader` | status scroll, sheet mobile, `usePathname` |
| `Gallery` | embla carousel + autoplay |
| `LanguageSwitcher` | dropdown + `usePathname` |
| `ThemeToggle` | `useTheme` dari next-themes |

Polanya selalu: **server component mengambil data → oper props biasa ke client component.**
`Navbar.tsx` (server) → `SiteHeader.tsx` (client) adalah contohnya.

## Lapisan data — `lib/joomla.ts`

Satu-satunya file yang menyentuh API. Semua fungsi menerima `locale`.

| Fungsi | Kegunaan |
|---|---|
| `joomla<T>(path, revalidate?)` | pembungkus `fetch` + header + ISR |
| `getArticle(alias, locale, catid)` | satu artikel berdasarkan alias dasar, **wajib** dipersempit ke kategorinya (dulu men-scan seluruh situs — pecah begitu artikel situs lewat 200, lihat CLAUDE.md §8) |
| `getCategory(catid, locale)` | semua artikel satu kategori, terurut |
| `getSubServices(parentAlias, locale)` | sub-service kategori 15 yang field `parent-service`-nya cocok dengan alias dasar layanan induk |
| `getHeading(key, locale)` | judul section dari kategori Headings |
| `getMenu(locale)` | item menu untuk satu bahasa |
| `getSiteName()` | nama situs dari Global Configuration |
| `mediaUrl(path)` | URL berkas di media Joomla |

Helper: `stripTags()`, `cleanImage()`, `listItems()`, `bodyOf()`, `fieldValue()`, `baseAlias()`.

`stripTags()` **men-decode entity HTML** — wajib, karena React akan meng-escape ulang apa pun
yang dirender sebagai teks. Lihat [06 — API](06-api-joomla.md#10-entity-html-dari-tinymce).

### Fallback terjemahan

`pickTranslations()` mengelompokkan artikel berdasarkan `baseAlias()` lalu memilih satu per
kelompok: bahasa diminta → `*` → Indonesia → sisanya. Per artikel, bukan per halaman.

## Routing bahasa

```
proxy.ts
  /            → rewrite ke /id        (URL tetap "/")
  /id, /id/…   → redirect 308 ke /     (satu URL kanonik)
  /en, /zh     → diteruskan apa adanya
  lainnya      → rewrite ke /id/…
```

Matcher-nya mengecualikan `_next`, `api`, dan path berekstensi — jadi `/api/revalidate` tidak
tersentuh.

Layout dan page memanggil `notFound()` untuk locale tak dikenal, sehingga `/fr` jadi 404,
bukan diam-diam menampilkan bahasa lain.

### Menambah bahasa

1. Tambah kode di `LOCALES`, `JOOMLA_LANG`, `HTML_LANG`, `LOCALE_NAMES` di `i18n.ts`
2. Tambah satu entri penuh di kamus `UI` — TypeScript akan menolak build kalau ada yang kurang
3. Perluas regex di `baseAlias()` (`/-(id|en|zh)$/`)
4. Buat Content Language di Joomla, lalu duplikasi artikel & item menu

Langkah 3 mudah terlewat.

## Label antarmuka

Kamus `UI` di `i18n.ts` memuat: `aboutEyebrow`, `learnMore`, `openMap`, `menu`, `navigation`,
`backToTop`, `toggleTheme`, `language`, `otherServices`, `moreServices`.

**Kenapa ini di kode, bukan di Joomla:** ini teks antarmuka, bukan materi editorial. Kalau
disimpan di Joomla, satu artikel yang lupa diterjemahkan akan menghasilkan tombol kosong.
Di kode, TypeScript memaksa ketiga bahasa terisi sebelum bisa di-build.

Batasnya sederhana: **isi halaman → Joomla. Label kontrol → kode.**

## Tema & warna

`globals.css` memakai token shadcn dengan warna oklch.

| Token | Light | Dark |
|---|---|---|
| `primary` | `oklch(0.552 0.216 26.5)` merah brand | `oklch(0.635 0.208 26.5)` dinaikkan agar kontras |
| `background` | putih | `oklch(0.155 0.004 265)` |
| `muted-foreground` | `0.505` | `0.715` |
| `ring` | = primary | = primary |

Pakai token, jangan warna mentah: `bg-background`, `text-muted-foreground`, `border-border`,
`bg-primary`. Dark mode ikut otomatis tanpa menulis `dark:` sama sekali.

Merah adalah **satu-satunya** aksen. Kalau butuh warna status, ambil dari `--chart-*`.

Dua tempat sengaja **selalu gelap** di kedua tema: hero (foto + gradien) dan pita Customers
(logo diratakan jadi putih, butuh dasar gelap).

### Dark mode

`next-themes` dengan `attribute="class"`, `defaultTheme="system"`. `<html>` memakai
`suppressHydrationWarning` karena next-themes menempelkan class sebelum React hydrate.

`ThemeToggle` tidak memakai state `mounted` — ikonnya dipilih CSS (`dark:hidden` /
`dark:block`), sehingga server dan client merender markup yang sama.

## Font

Poppins saja, bobot 300/400/500/600/700 didaftarkan eksplisit.

**Poppins bukan variable font di Google Fonts** — bobot yang tidak didaftarkan tidak ikut
diunduh, dan browser akan memalsukan tebalnya (hasilnya jelek). Kalau memakai `font-extrabold`,
tambahkan `"800"`.

Di `@theme inline` **wajib nama font literal**; `var(--font-poppins)` di sana menghasilkan
kosong karena Tailwind v4 menyelesaikannya saat parse. Ini jebakan bawaan `shadcn init`.

Tidak ada font mono yang dikirim — tidak ada kode di situs ini.

## Ikon

`lib/icons.ts` — peta `ICONS` dari nilai field Joomla ke komponen lucide, plus `iconFrom()`
yang selalu punya fallback.

`lib/social.ts` — `BRAND_PATHS` dari simple-icons, dirender sebagai `<svg>` dengan
`fill-current` agar ikut warna tema.

Menambah ikon = dua langkah (kode + Joomla). Ini harga dari daftar terkurasi;
alasannya di [01 — Arsitektur](01-arsitektur.md#ikon-daftar-terkurasi-bukan-lucide-reactdynamic).

## shadcn/ui

- Style **new-york**, primitive **Base UI** (bukan Radix)
- Komposisi memakai `render={<Button/>}`, **bukan** `asChild`
- `src/components/ui/**` **dikecualikan dari ESLint** — kode hasil generate, dan carousel-nya
  melanggar `react-hooks/set-state-in-effect`
- Jangan menyunting file di `ui/` dengan tangan; jalankan ulang CLI-nya

## Caching

Setiap `fetch` memakai `next: { revalidate: 60 }`. **Cache Components dimatikan** —
proyek ini memakai model cache lama. `/api/revalidate` memanggil `revalidatePath('/', 'layout')`
untuk membuang cache halaman sekaligus layout (navbar & footer ikut segar).

## Aksesibilitas yang sudah ada

- Smooth scroll dimatikan pada `prefers-reduced-motion: reduce`
- Autoplay carousel juga mati pada preferensi yang sama, dan berhenti saat hover/fokus
- Titik navigasi carousel punya `aria-label` dan `aria-current`
- Alamat memakai tag `<address>`
- Link keluar memakai `rel="noopener noreferrer"`
- Semua tombol ikon punya `aria-label` yang ikut bahasa

## Perintah

```bash
npm run dev      # http://localhost:3000
npm run build
npm run lint
npx tsc --noEmit
```

`npx tsc --noEmit` dan `npm run lint` harus bersih. Tidak ada test otomatis.
