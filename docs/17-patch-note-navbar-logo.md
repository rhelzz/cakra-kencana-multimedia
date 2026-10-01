# Patch Note — Navbar Baru + Logo Saja di Atas Hero

Tanggal: 2026-10-01
Pelaksana: agent (atas izin owner, sesi revisi)

## 1. Menu navbar: Beranda, Tentang Kami, Layanan, Kontak

Semua link memakai `#` (placeholder) sesuai instruksi — bukan lagi
scroll-to-section. Kelanjutannya (URL final) menyusul dari owner.

**Data (Joomla, cara resmi via SQL karena PATCH menu via API selalu 500):**

- 12 item `mainmenu` (id 101–112, 4 per bahasa) → `link='#'`.
- Item 101 `Home` bertipe `component` → diubah ke `type='url'` agar `#`
  dipakai (`hrefFor()` hanya pakai `link` untuk tipe `url`).
- Item ke-4 diganti: `Our customers`→`Contact` (104),
  `Klien Kami`→`Kontak` (111), item 112→`联系我们`.
- Hasil akhir: ID = Beranda/Tentang Kami/Layanan/Kontak,
  EN = Home/About Us/Services/Contact,
  ZH = 首页/关于我们/服务/联系我们 — semua `href="#"`.
- Backup: `joomla_db_before_navbar.sql` (temp).
- Insiden kecil: update judul zh via shell tanpa charset merusak jadi `????`;
  diperbaiki via file SQL UTF-8, terverifikasi HEX = `联系我们`. Judul zh lain
  tidak tersentuh.

Tidak ada perubahan kode untuk menu — `getMenu()`/`NavLink` sudah menangani
`href="#"` (plain `<a>`, tidak pernah status active).

## 2. Logo: gambar saja, besar di atas hero, mengecil saat scroll

File: `frontend/src/components/SiteHeader.tsx` (blok brand).

- Sebelum: di atas hero tampil teks "PT Cakra Kencana Multimedia",
  logo gambar hanya muncul setelah scroll (cross-fade dua mark).
- Sesudah: **satu `<img>` logo di semua state** — tinggi `h-16 md:h-20`
  di atas hero, menganimasikan tinggi ke `h-13` saat melewati hero
  (`transition-[height]`, mekanisme trigger scroll 0.6×viewport tidak berubah).
- Aksesibilitas: `aria-label={siteName}` di link brand menggantikan teks
  yang dihapus (logo `alt=""` tetap dekoratif). Drawer mobile tidak berubah.

## Verifikasi

- `npx tsc --noEmit` → bersih. `npm run lint` → 0 error, 0 warning.
- Render `/`: nav Beranda/Tentang Kami/Layanan/Kontak semua `href="#"`,
  logo `h-16 md:h-20`. `/en`: Home/About Us/Services/Contact semua `#`.
- Catatan cache: ganti menu via SQL tidak memicu plugin revalidate
  (hanya event save Joomla yang memicu) → `POST /api/revalidate` manual
  sekali setelah update.
