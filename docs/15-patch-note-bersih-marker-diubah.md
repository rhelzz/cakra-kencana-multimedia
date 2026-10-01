# Patch Note — Bersihkan Marker "[DIUBAH]" di Layanan Reklame

Tanggal: 2026-10-01
Pelaksana: agent (atas izin owner, sesi revisi)
Laporan awal: screenshot owner — deskripsi "Reklame" di daftar layanan
diawali teks `[DIUBAH]`.

## Penyebab

Bukan bug kode. Marker `[DIUBAH]` tertulis langsung di `introtext` artikel
Joomla (sisa penanda edit manual). Frontend hanya menampilkan apa yang ada
di Joomla, sesuai aturan "copy milik Joomla".

## Perbaikan (data Joomla, via API)

- Artikel: `238` — `Reklame` (`service-indoor-outdoor-reklame-id`,
  kategori Services `catid=10`, id-ID, published).
- `PATCH /content/articles/238` → 200, `introtext` dikirim ulang tanpa marker.
  Sebelum: `<p>[DIUBAH] Produksi dan pemasangan …`
  Sesudah: `<p>Produksi dan pemasangan …`
- Cek seluruh DB: 0 artikel tersisa mengandung `[DIUBAH]` di
  `introtext`/`fulltext` — hanya artikel ini yang kena.

## Verifikasi

- DB: `introtext` artikel 238 bersih, `COUNT … LIKE '%[DIUBAH]%'` = 0.
- Render `/services` dan `/` pasca-revalidate: 0 kemunculan `DIUBAH`.
