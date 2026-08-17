# 01 — Arsitektur

## Bentuk sistem

```
                        ┌──────────────────────────────┐
   Editor  ──login──▶   │  Joomla 5.4.7  (backend/)    │
                        │  administrator/               │
                        │  MySQL joomla_db              │
                        └───────────┬──────────────────┘
                                    │ Web Services API (JSON:API)
                                    │ header X-Joomla-Token
                                    ▼
                        ┌──────────────────────────────┐
   Pengunjung ──HTTP─▶  │  Next.js 16.3  (frontend/)   │
                        │  Server Components + ISR      │
                        └──────────────────────────────┘
```

**Template Joomla tidak pernah dirender.** Pengunjung tidak pernah menyentuh `backend/`,
kecuali untuk mengambil file gambar dari `backend/images/`.

> **Nama `backend/` dan `frontend/` hanya berlaku di komputer lokal.** Di hosting keduanya
> adalah dua deployment terpisah dengan root masing-masing, dan sebaiknya tidak berada di dalam
> satu folder induk bersama. Lihat [11 — Deploy](11-deploy.md#tata-letak-di-hosting--baca-ini-sebelum-meng-upload-apa-pun).

## Kenapa headless, bukan Next.js "di atas" Joomla

Tidak ada cara memasang Next.js di dalam Joomla — Joomla merender template PHP-nya sendiri.
Memaksa keduanya saling menyuntik hasil render menghasilkan dua sistem render yang berebut
satu halaman. Memisahkan keduanya membuat batasnya jelas: Joomla mengurus data dan hak akses
editor, Next.js mengurus tampilan.

## Alur satu request

```
GET /                                     (Indonesia, tanpa prefix)
  │
  ├─ proxy.ts  ──rewrite──▶  /id          URL di address bar tetap "/"
  │
  ├─ app/[locale]/layout.tsx
  │     ├─ Navbar   → getMenu('id')            → GET /menus/site/items
  │     └─ Footer   → getMenu, getCategory,    → beberapa GET
  │                    getArticle, getSiteName
  │
  └─ app/[locale]/page.tsx
        ├─ Hero      → getArticle('home-hero', 'id')
        ├─ About     → getCategory(9) + getCategory(8)
        ├─ Services  → getCategory(10) + getHeading('services')
        ├─ Customers → getCategory(11) + getHeading('customers')
        └─ Offices   → getCategory(12) + getHeading('offices')
```

Setiap `fetch` memakai `next: { revalidate: 60 }`. Hasilnya di-cache; request berikutnya
tidak memukul Joomla lagi.

## Dua jalur update konten

**Jalur normal (pasif).** Cache kedaluwarsa 60 detik, halaman dibangun ulang saat ada
request berikutnya.

**Jalur instan (aktif).** Plugin Joomla memanggil frontend begitu editor menekan Save:

```
Save di admin Joomla
  → plg_system_nextrevalidate
  → POST http://localhost:3000/api/revalidate?secret=…
  → revalidatePath('/', 'layout')
  → cache dibuang, halaman berikutnya dibangun ulang
```

Terukur ~3.3 detik dari tekan Save sampai halaman berubah. Timeout plugin 5 detik, jadi
frontend yang mati **tidak pernah** menggagalkan penyimpanan di Joomla — hanya muncul warning.

Detail: [05 — Kustomisasi Joomla](05-kustomisasi-joomla.md#plugin-plg_system_nextrevalidate).

## Batas keamanan

| Hal | Aturan |
|---|---|
| `JOOMLA_TOKEN` | Hanya ada di server. Semua pengambilan data terjadi di Server Component. |
| Client Component | `SiteHeader`, `Gallery`, `LanguageSwitcher`, `ThemeToggle` — menerima props biasa, tidak pernah memanggil API. |
| `/api/revalidate` | Menolak 403 kalau `secret` salah **atau** `REVALIDATE_SECRET` belum diset. |
| `configuration.php` | Tidak pernah masuk git (berisi kredensial DB dan `$secret` Joomla). |

Kalau suatu saat ada komponen yang butuh data Joomla dan harus interaktif, pola yang benar
tetap: server component mengambil data → oper sebagai props ke client component.

## Keputusan arsitektur beserta alasannya

Bagian ini ada supaya tidak ada yang "memperbaiki" hal yang sudah sengaja begitu.

### Fallback bahasa per-item, bukan per-halaman

Terjemahan diikat lewat alias, bukan fitur Associations Joomla. Kalau artikel Mandarin belum
ada, hanya blok itu yang tampil Indonesia — halaman tidak pernah bolong. Lihat
[03 — Model Konten](03-model-konten.md#multibahasa).

### Heading section disimpan sebagai artikel, bukan judul kategori

Satu kategori hanya punya satu judul dan tidak bisa diterjemahkan. Jadi heading ("Layanan
kami", "服务项目") disimpan sebagai artikel kecil di kategori **Headings**.

### Ikon: daftar terkurasi, bukan `lucide-react/dynamic`

Dokumentasi Lucide sendiri melarang komponen dinamisnya karena menarik ~1500 ikon ke dalam
build. 23 pilihan terkurasi juga lebih baik untuk editor daripada 1500 nama yang harus
dihafal. Harganya: menambah ikon butuh dua langkah (kode + field Joomla).

### Ikon brand dari `simple-icons`

Lucide 1.30 membuang semua ikon brand karena alasan trademark. **LinkedIn tidak ada** di
simple-icons (dihapus atas permintaan LinkedIn) dan otomatis jatuh ke ikon globe.

### Gambar pakai `<img>`, bukan `next/image`

Sumbernya URL Joomla yang baru diketahui saat runtime; `next/image` menuntut `remotePatterns`
untuk host Joomla. Hero bahkan memakai CSS `background-image`, jadi tidak butuh konfigurasi
sama sekali. Ubah kalau optimasi gambar sudah sepadan.

### Cache Components dimatikan

Next 16 punya model cache baru (`use cache`). Proyek ini memakai model lama
(`next: { revalidate }`). Jangan "modernkan" tanpa membaca
`frontend/node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md`.

### shadcn/ui memakai Base UI, bukan Radix

Komposisi komponen memakai `render={<Button/>}`, **bukan** `asChild`. Salah satu ini penyebab
error yang tidak jelas.
