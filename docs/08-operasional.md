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

### 1. Ganti URL sosmed dummy
Kelima akun masih placeholder (`facebook.com/cakrakencanamultimedia`, dst.).
**Content → Articles**, kategori Social, field **Link**.

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

## Deploy (belum dikerjakan)

Belum pernah dilakukan. Yang perlu dipikirkan:

**Frontend.** Vercel adalah jalur termudah untuk Next.js. `JOOMLA_API` harus menunjuk domain
Joomla yang bisa diakses publik (bukan `.test`), dan `revalidatePath` bekerja normal di sana.

**Backend.** Joomla butuh hosting PHP + MySQL biasa. Yang wajib diatur:
- pola `location ~ \.php(/|$)` (nginx) atau `.htaccess` bawaan (Apache — biasanya sudah benar)
- HTTPS, karena token API lewat di header
- `images/` bisa diakses publik (frontend memuat gambar langsung dari sana)
- URL plugin Next Revalidate diarahkan ke domain frontend produksi

**Yang paling mudah terlewat:** ID kategori di server produksi hampir pasti berbeda dari
lokal kalau kontennya dibuat ulang, bukan di-restore dari dump. Restore dump database jauh
lebih aman daripada membuat ulang manual.

## Utang teknis yang sudah ditandai

| Lokasi | Isi |
|---|---|
| `joomla.ts` — `getCategory()` | `ponytail:` satu halaman 200 item; tambahkan paging kalau kategori melampauinya |
| `joomla.ts` — `getArticle()` | Menarik 200 artikel lalu menyaring di JS; tidak ada filter alias di API |
| `services/[id]/page.tsx` | `eslint-disable` untuk `react-hooks/static-components`, dengan alasan tertulis |
| `eslint.config.mjs` | `src/components/ui/**` dikecualikan — kode generate shadcn |

## Yang belum ada sama sekali

- Tidak ada test otomatis
- Tidak ada CI
- Tidak ada staging
- Tidak ada monitoring/alerting
- Tidak ada halaman 404 kustom (masih bawaan Next)
- `alt` gambar carousel hanya bahasa Indonesia (keputusan sadar, lihat
  [03 — Model Konten](03-model-konten.md#artikel-tanpa-bahasa-))
