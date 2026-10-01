# Patch Note — Hapus Sub-Service & Halaman Detail

Tanggal: 2026-10-01
Pelaksana: agent (atas izin owner, sesi revisi)

## Ringkasan

Sub-service dan halaman detail layanan dihapus total: link "Selengkapnya"
hilang, route `/services/[slug]` dihapus (sekarang 404), dan seluruh data
sub-service di DB dibersihkan. Halaman listing `/services` tetap ada sebagai
tampilan statis (11 layanan), begitu pula 6 kartu di home.

## Database (Joomla)

Backup pra-hapus: `joomla_db_before_subservice_delete.sql` (6,2 MB, temp).

- **267 artikel** kategori 15 `Service sub-items` (393–686, 89×3 bahasa)
  dihapus via API (`PATCH state=-2` → `DELETE`, 0 gagal). Joomla otomatis
  membersihkan 267 `assets` + 267 `workflow_associations` + 267
  `fields_values` — terverifikasi 0 sisa untuk ID-ID tersebut.
- **Kategori 15 dihapus.** `DELETE /content/categories/15` via API jawab 204
  palsu (quirk DELETE semu, kategori tetap ada) → hapus via SQL + rebalance
  nested-set (`lft/rgt` digeser −2). Tree terverifikasi konsisten
  (0–27 kontigu, tanpa duplikat, 14 kategori tersisa).
- **Field 4 `parent-service` dihapus** (definisi + assignment kategorinya).
  Field ini eksklusif dipakai kategori 15 (267 values, semua ikut terhapus
  bersama artikel). Field lain (1,2,3,5–8) utuh.
- **Smart Search dibersihkan:** 267 link live terhapus otomatis oleh Joomla
  saat artikel di-delete; 145 link yatim lama (`route catid=15`, sisa
  restrukturisasi dulu) + `taxonomy_map`-nya dihapus manual via SQL.
- Artikel sub-service **tidak merujuk file gambar apapun** (kolom `images`
  kosong, tidak ada `<img>`/`images/` di isi) — tidak ada file di
  `backend/images/` yang perlu dihapus.
- Hasil akhir: `content` 455→188, `categories` 15→14, `fields` 8→7,
  `workflow_associations` 455→188 (1:1 dengan content ✓).
- Catatan: ratusan asset yatim `com_content.article.*` lain di DB adalah
  **bawaan lama** (pra-sesi ini), bukan akibat penghapusan ini — tidak disentuh.

## Frontend (`frontend/`)

- **Dihapus:** folder `src/app/[locale]/services/[slug]/` (detail + masonry
  sub-service + daftar sibling + metadata-nya).
- **`components/ServiceCard.tsx`:** kartu home jadi statis — blok `Link`
  + `learnMore` + `ArrowRight` dibuang, props `base`/`locale` dihapus
  (call-site `Services.tsx` disesuaikan). Link "Lebih banyak → /services"
  tetap ada.
- **`app/[locale]/services/page.tsx`:** `ServiceRow` jadi statis (`div`,
  tanpa hover/arrow/link), props `base`/`locale` dibuang. Breadcrumb,
  hitungan layanan, dan zig-zag tetap.
- **`lib/joomla.ts`:** `serviceSlug`, `getSubServices`, dan
  `CATEGORY.serviceSubItems` dihapus. `baseAlias` tetap (dipakai Contact,
  Footer, `pickTranslations`).
- **`lib/i18n.ts`:** key mati dibuang di 3 locale — `learnMore`,
  `otherServices`, `scope`, `scopeUnit` (13 entri).
- Menu Joomla tidak menaut ke halaman detail (hanya anchor `#services`) —
  tidak ada menu yang patah.

## Verifikasi

- `npx tsc --noEmit` → bersih (sempat ada error cache `.next` menunjuk
  `[slug]` yang dihapus → `.next` dibuang, regenerate otomatis).
- `npm run lint` → 0 error, 0 warning baru.
- Render: `/` 200, `/services` 200 dengan 0 `Selengkapnya` dan 0 link
  `/services/<slug>`; `/services/digital-printing` → **404** sesuai rencana.

## Rollback

Restore: `mysql joomla_db < joomla_db_before_subservice_delete.sql`, lalu
`git checkout` file-file frontend yang diubah + kembalikan folder `[slug]`
dari git (`git status` untuk daftarnya).
