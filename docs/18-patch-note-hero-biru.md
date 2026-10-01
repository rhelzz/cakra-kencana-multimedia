# Patch Note — Hero Terang + Palet Biru #004392

Tanggal: 2026-10-01
Pelaksana: agent (atas izin owner, sesi revisi)
Referensi: mockup hero gedung biru (teks kiri, foto kanan, headline dua baris).

## 1. Palet biru (data Joomla — tanpa hardcode di kode)

- Artikel `theme` (id 671): `brand-color` `#ff0000` → **`#004392`**,
  `brand-color-dark` dikosongkan (auto-derive biru untuk dark mode).
  Backgrounds tetap (`#ffffff` / `#0d0b0b`).
- Cara: `UPDATE fields_values` via SQL (tulis custom field via API bermasalah,
  sudah didokumentasikan). Backup: `joomla_db_before_blue_theme.sql` (temp).
- Hasil live: `--primary oklch(0.398 0.1435 257.4)` (light) /
  `oklch(0.550 0.1382 257.4)` (dark). Seluruh token turunan (accent, ring,
  surface, shadow) ikut hue biru otomatis via `theme.ts`.
- `brand-color-dark` kosong = dark primary di-derive (lebih terang agar kontras).

## 2. Hero terang ala referensi (kode)

File: `frontend/src/components/Hero.tsx` (tulis ulang blok section).

- Layout split: copy di atas `bg-background` sebelah kiri (max 2xl),
  foto `home-hero` memenuhi kanan (`lg:left-[36%]`) dan dissolve ke
  background via gradient (`from-background … to-transparent`) + fade bawah.
  Di HP: overlay wash agar teks tetap terbaca di atas foto.
- Eyebrow = nama situs dari Joomla (`getSiteName()`, uppercase via CSS).
  Judul + sub tetap dari artikel `home-hero` (tidak ada copy di-hardcode).
- Tombol sekunder disesuaikan untuk latar terang
  (`border-border text-foreground hover:bg-accent`).
- Struktur konten terpangkas: eyebrow + headline + 1 sub + 2 tombol saja.

## 3. Navbar di atas hero terang (kode)

File: `frontend/src/components/SiteHeader.tsx`.

- Top-state dulu `text-white` (untuk hero gelap) → kini `text-foreground`
  + hover `accent` di kedua state. Link ghost/dropdown ikut warna teks.
- Logo besar-di-atas → kecil-saat-scroll dari revisi 3 tidak berubah.

## 4. Fallback biru (kode, anti kilasan merah)

- `globals.css`: fallback `:root`/`.dark` disinkron ke hasil derive biru
  + komentar diperbarui (merah hanya tersisa di `--destructive` yang disengaja).
- `theme.ts`: default `brand` `#d31520` → `#004392`, fallback hex-invalid
  → oklch biru.
- `scripts/theme.check.ts`: ekspektasi default diperbarui ke biru.
  `theme: ok / dark brand ok / colored background ok`, exit 0.

## 5. Bersih-bersih konten tak terpakai (DB)

- Audit live: kategori Headings (14) pas 12 = 4 key × 3 bahasa, semua dipakai.
  Kategori 2 (`home-hero`, `footer-copyright`, `theme`) dan fields 1–3, 5–8
  semua dipakai. **Tidak ada kategori/konten tak terpakai tersisa.**
- Artikel 789 `Layanan Baru` (trash sisa restore prod) dihapus permanen
  (`DELETE` 204). Total artikel 188→187.
- 6 logo customer unpublished (PGN, Indosat, Daihatsu, AHM, Mandiri, Telkom)
  **disengaja** (non-unggulan) → dibiarkan.

## 6. Insiden Laragon mati (non-perubahan)

Di tengah kerja, Laragon mati total (MySQL/nginx/PHP down). Stack di-start
manual, lalu owner menyalakan Laragon → tabrakan port diselesaikan: proses
manual nginx + php-cgi dimatikan (milik Laragon yang dipakai), satu mysqld
manual dipertahankan (datadir sama, dipakai bersama). Diverifikasi: DB utuh
(188 artikel saat itu), API 401, frontend 200.

## Verifikasi

- `npx tsc --noEmit` → 0 error. `npm run lint` → 0/0.
  `npx tsx scripts/theme.check.ts` → 3× ok.
- Render `/`: 200, primary hue 257, hero tanpa `bg-neutral-950`/`text-white`,
  `lg:left-[36%]` + logo `h-16 md:h-20` ada, 0 `Selengkapnya`/`drive.google`.
- `/en` + `/zh` 200, nav 4 item `#` per locale. H2 contact terisi
  ("Hubungi Kami" / "Contact Us"). `/services` 0 "Layanan Baru".

## Catatan copy

Headline hero masih kalimat Joomla existing
("Advertising, General Contractor and Tax & Permit Service").
Kalau mau diganti jadi "We Make Brands Visible." seperti referensi
(+ versi ID/ZH), beri tahu kalimat pastinya per bahasa.
