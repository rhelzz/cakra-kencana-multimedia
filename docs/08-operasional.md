# 08 — Operasional

## Kalau perubahan tidak muncul

Urutan pemeriksaan, dari yang paling sering:

1. **Artikel sudah Published?** Status Unpublished tidak dirender.
2. **Bahasa artikel benar?** Artikel `en-GB` tidak akan muncul di halaman Indonesia.
3. **Kategori benar?**
4. **Tunggu ~60 detik.** Kalau setelah itu muncul, berarti webhook revalidate yang bermasalah,
   bukan kontennya.
5. **Cek plugin:** System → Plugins → **Next Revalidate** — Enabled? URL-nya menunjuk port yang
   benar? Dev server sering bergeser ke 3001 kalau 3000 dipakai proses lain.
6. **Secret cocok?** Nilai di plugin harus sama persis dengan `REVALIDATE_SECRET` di
   `frontend/.env.local`.
7. **Gambar tidak berubah padahal file sudah diganti** → nama file sama, cache browser.
   Ctrl+F5.

Uji webhook secara manual:

```bash
curl -X POST "http://localhost:3000/api/revalidate?secret=SECRET_KAMU"
# {"revalidated":true,"at":...}   → sehat
# {"revalidated":false}  403      → secret salah
```

## Kalau seluruh situs error

| Gejala | Periksa |
|---|---|
| Semua halaman 500 | MySQL hidup? Joomla bisa dibuka? |
| API 404 di semua endpoint | Perbaikan nginx `\.php(/|$)` — lihat [02](02-setup.md#perbaikan-nginx-yang-wajib-ada) |
| API 403 | Token kedaluwarsa atau plugin Web Services mati |
| Satu section hilang, sisanya normal | Semua artikel kategori itu terhapus/unpublished, atau ID kategori berubah |
| Hero hilang | Pernah terjadi karena batas 20 artikel — pastikan `page[limit]` masih ada di `joomla.ts` |

## Backup

Yang harus dicadangkan — **git saja tidak cukup:**

| Apa | Kenapa |
|---|---|
| **Database `joomla_db`** | Seluruh konten ada di sini. Git tidak menyimpannya. |
| `backend/configuration.php` | Kredensial DB + `$secret` Joomla. Sengaja tidak masuk git. |
| `frontend/.env.local` | Token API + revalidate secret. Sengaja tidak masuk git. |
| `backend/images/` | Sebagian sudah di git (unggahan kita); gambar baru dari editor tidak. |

Dump database:

```bash
mysqldump -uroot joomla_db > backup-joomla_db-$(date +%F).sql
```

**Konten adalah aset yang paling tidak tergantikan di proyek ini.** Kode ada di GitHub,
Joomla core bisa diunduh ulang, tetapi artikel, terjemahan, dan struktur kategori hanya ada
di database itu.

## Yang harus diberesi sebelum publikasi

Belum siap produksi. Urut berdasarkan dampak:

### 1. ~~Ganti URL sosmed dummy~~ — selesai
Instagram, Facebook, WhatsApp sudah memakai akun asli. YouTube dan TikTok dikosongkan
(ikon tersembunyi) sampai akun resminya ada.

**Sisa yang perlu dikonfirmasi ke klien:** apakah 0838 9996 6999 memang nomor WhatsApp
aktif — sekarang dipakai sebagai tujuan tombol WhatsApp.

### 2. Review terjemahan
Teks Indonesia dan Mandarin ditulis mesin dan **belum pernah diperiksa penutur asli**.
Istilah teknis percetakan paling rawan: 胶印 (offset), 丝网印刷 (sablon), 车间 (workshop).

### 3. Kompres gambar
Carousel ~7.6 MB untuk 4 gambar, hero ~512 KB. Berat untuk pengunjung mobile Indonesia.
Turunkan ke lebar ~1600px dan konversi WebP — biasanya jadi 150–250 KB per gambar tanpa
perbedaan yang terlihat.

### 4. Tambahkan `metadataBase`
`hreflang` sekarang memakai path relatif (`/en`, `/zh`). Google lebih suka URL absolut.
Begitu domain produksi ada, tambahkan `metadataBase` di `app/[locale]/layout.tsx` — tag-nya
otomatis jadi absolut.

### 5. Isi halaman detail layanan
Sekarang hanya berisi satu kalimat karena artikel baru punya `introtext`. Lihat
[04 — Panduan Editor](04-panduan-editor.md#mengisi-halaman-detail).

### 6. Periksa izin logo klien
Logo yang terpasang adalah merek dagang perusahaan lain, dipakai sebagai contoh. Pastikan ada
izin, atau ganti dengan klien yang memang menyetujui.

### 7. Ganti token dan secret produksi
Token dan secret sekarang dibuat untuk lingkungan lokal. Buat yang baru saat deploy dan
jangan pernah memakai ulang yang lama.

## Deploy

Langkah lengkapnya pindah ke **[11 — Deploy & Serah Terima](11-deploy.md)**: paket apa yang
dikirim saat menyerahkan proyek, urutan pasang backend lalu frontend, cara menyambungkan
webhook, dan checklist verifikasi 10 langkah.

Tiga hal yang paling sering menggagalkan deploy, diringkas di sini:

1. **nginx** butuh `location ~ \.php(/|$)`, bukan `\.php$` — kalau tidak, seluruh API 404.
2. **Restore dump database**, jangan buat ulang konten manual. ID kategori ditulis mati di
   `joomla.ts`; ID yang berbeda membuat halaman kosong tanpa pesan error.
3. **Token API harus dibuat ulang** di server baru. Token diturunkan dari `$secret` situs, jadi
   token lama dari dump tidak akan pernah bekerja pada instalasi yang secret-nya berbeda.

## Utang teknis yang sudah ditandai

| Lokasi | Isi |
|---|---|
| ~~`joomla.ts` — `getCategory()`~~ | ~~satu halaman 200 item~~ — selesai, sekarang lewat `joomlaPaged()` yang mengikuti `page[offset]` |
| `joomla.ts` — `getArticle()` | Menarik 200 artikel lalu menyaring di JS; tidak ada filter alias di API |
| `services/[slug]/page.tsx` | `eslint-disable` untuk `react-hooks/static-components`, dengan alasan tertulis |
| `eslint.config.mjs` | `src/components/ui/**` dikecualikan — kode generate shadcn |

## Yang belum ada sama sekali

- Tidak ada test otomatis
- Tidak ada CI
- Tidak ada staging
- Tidak ada monitoring/alerting
- Tidak ada halaman 404 kustom (masih bawaan Next)
- `alt` gambar carousel hanya bahasa Indonesia (keputusan sadar, lihat
  [03 — Model Konten](03-model-konten.md#artikel-tanpa-bahasa-))
