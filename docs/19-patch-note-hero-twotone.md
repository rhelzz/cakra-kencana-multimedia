# Patch Note — Hero 1:1 Referensi (Two-Tone) + Bersih-bersih

Tanggal: 2026-10-01
Pelaksana: agent (atas izin owner, sesi revisi)
Referensi: mockup "We Make Brands Visible." (eyebrow + headline dua warna + subjudul, tanpa tombol).

## Keputusan owner

- Tombol CTA hero ("Lihat layanan"/"Tentang kami") **dihapus** (1:1 referensi).
- Headline: EN "We Make Brands Visible.", ID & ZH terjemahan natural.
- Headline **dua warna**: bagian akhir biru, sisanya gelap.
- Foto hero beda dari mockup: **tidak masalah** (tetap `hero.jpg`).

## 1. Content model baru: field `hero-accent`

Dua-warna butuh headline terbelah. Daripada menebak di kode, ditambah custom
field **`hero-accent`** (type `text`, cat 2 Uncategorised) — bagian headline
yang diberi warna brand. `Hero.tsx` membelah: `lead` = title minus accent,
`tail` = accent (warna `text-primary`). Bila accent kosong → headline satu warna.

Dibuat via SQL (API `/fields` tidak tersedia → 404), mengikuti bentuk field
warna yang ada (asset_id 0, `params`/`fieldparams` sama):

| Item | Title | `hero-accent` |
|---|---|---|
| 1 (`home-hero-en`) | We Make Brands Visible. | Brands Visible. |
| 34 (`home-hero-id`) | Kami Membuat Merek Terlihat. | Merek Terlihat. |
| 35 (`home-hero-zh`) | 我们让品牌可见 | 品牌可见 |

Subjudul (introtext) juga diperbarui:
- EN: *We provide comprehensive General Contracting, Tax & Permit services, and trusted branding solutions.*
- ID: *Kami menyediakan layanan General Contracting, Perpajakan & Perizinan yang menyeluruh, serta solusi branding yang tepercaya.*
- ZH: *我们提供全面的总承包、税务与许可服务，以及值得信赖的品牌解决方案。*

Backup: `joomla_db_before_hero_rewrite.sql` (temp).

## 2. Frontend

- `Hero.tsx`: eyebrow (nama situs, uppercase) + headline dua-warna + subjudul.
  Tombol & ikon CTA dibuang; `ui`/`t`/lucide tak lagi dipakai di sini.
  Foto kanan mulai `lg:left-[34%]`, fade kiri + fade bawah.
- `i18n.ts`: hapus `viewServices`, `exploreCompany` (3 bahasa) — jadi mati.
- `joomla.ts`: tipe `hero-accent` ditambah; tipe `parent-service` (field sudah
  dihapus sesi lalu) dibuang.

## 3. Bersih-bersih DB

- Hapus **2 asset ACL yatim** `com_content.field.0` (id 111, "Parent service")
  dan `com_content.field.4` (id 197) — sisa field yang sudah dihapus. Nested-set
  dirapikan; tree terverifikasi (0 duplikat, root rgt turun 1245→1241).
- Audit lengkap: **0 field tanpa rujukan & nilai**, **0 fields_values yatim**,
  **0 kategori non-sistem kosong**. Tidak ada konten lain yang tak terpakai.

## Perlu keputusan owner (BELUM dihapus)

- 6 artikel customer **unpublished** (id 18–23: PGN, Indosat, Daihatsu, AHM,
  Bank Mandiri, Telkom) di cat 11 — sengaja disembunyikan (non-unggulan),
  bukan sampah. Hapus ke Trash hanya bila logo lama memang tak diperlukan.

## Verifikasi (1:1)

- `npx tsc --noEmit` 0 error; `npm run lint` 0/0; `theme.check` 3× ok.
- Grep: 0 sisa `viewServices|exploreCompany|parent-service|getSubServices|serviceSlug`.
- Render `/` H1 "Kami Membuat Merek Terlihat." (biru pada "Merek Terlihat."),
  `/en` "We Make Brands Visible." (biru pada "Brands Visible."), `/zh`
  "我们让品牌可见" (biru pada "品牌可见") — tombol hero 0 di ketiganya.
- Foto kanan full opacity: overlay desktop hanya gradient kiri
  (`from-20% → to-55%`), mobile wash ringan (`bg-background/45`).

## Catatan cache

Screenshot owner sempat menampilkan headline + tombol lama (pra-revisi):
itu HTML cache browser — hard-refresh (Ctrl+F5) untuk versi baru.
