# 11 — Deploy & Serah Terima

> **Status: belum pernah dijalankan di server sungguhan.** Isi dokumen ini diturunkan dari
> membaca konfigurasi proyek yang benar-benar ada, bukan dari pengalaman deploy. Langkah yang
> berupa fakta terverifikasi ditandai ✅; langkah yang masih perkiraan ditandai ⚠️.

Situs ini **dua aplikasi terpisah** yang kebetulan tinggal di satu repo:

```
Pengunjung  →  Next.js (Node)  ──HTTP + token──→  Joomla (PHP + MySQL)
                    ↑                                     │
                    └────── webhook revalidate ───────────┘
```

Keduanya bisa berada di server berbeda, bahkan penyedia berbeda. Yang mengikat cuma tiga hal:
URL API, token, dan satu secret webhook.

---

## Bagian A — Paket serah terima

Menjawab pertanyaan "kirim apa saja". **Jangan kirim seluruh folder `backend/`** — isinya 9.862
file dan hampir semuanya kode inti Joomla yang bisa diunduh ulang.

| Kirim | Isi | Kenapa |
|---|---|---|
| `frontend/` | tanpa `node_modules/` dan `.next/` | Seluruh frontend, buatan sendiri |
| `backend/plugins/system/nextrevalidate/` | 3 file | Satu-satunya kode PHP buatan sendiri |
| `backend/images/` | 13 file | Logo, hero, galeri, logo klien |
| `joomla_db.sql` | ±5 MB | Semua konten, konfigurasi, dan pengaturan plugin |
| `configuration.php` | 1 file | **Opsional** — lihat catatan di bawah |

✅ Terverifikasi: `backend/.gitignore` memang sudah dirancang begitu — ignore semuanya, lalu
re-add hanya empat hal itu. Jadi **repo GitHub sudah berisi paket lengkap ini**; yang tidak ada
di GitHub hanya `joomla_db.sql` dan `configuration.php`.

**Karena itu ZIP tidak wajib.** Cukup kirim link repo + satu file `.sql` lewat Google Drive.
Kalau tetap ingin kirim ZIP, buang `node_modules/`, `.next/`, dan `backend/` selain dua folder
di atas — kalau tidak, ukurannya membengkak ratusan MB tanpa guna.

### Membuat dump database

```bash
mysqldump -uroot --default-character-set=utf8mb4 \
          --add-drop-table --single-transaction \
          joomla_db > joomla_db.sql
```

✅ Terverifikasi: menghasilkan 5,0 MB, 76 tabel, `SET NAMES utf8mb4`.

`--default-character-set=utf8mb4` **wajib**. Tanpa itu, seluruh konten Mandarin berubah jadi
tanda tanya, dan kerusakannya tidak terlihat sampai halaman `/zh` dibuka.

### ⚠️ Dua rahasia ikut di dalam dump

```
n213k_extensions → nextrevalidate → params.secret
n213k_user_profiles → joomlatoken.token
```

Keduanya **harus diganti setelah deploy** (Bagian D dan Bagian B langkah 6). Untuk sekarang:
perlakukan file `.sql` seperti file berisi password — kirim lewat Drive yang dibatasi ke satu
email, bukan link publik, dan jangan pernah commit ke Git.

### ⚠️ Soal `configuration.php`

File ini berisi kredensial database dan `$secret` situs, dan **sengaja tidak pernah masuk Git**.

Ada dua jalur, dan yang kedua lebih bersih:

| Jalur | Cara | Konsekuensi |
|---|---|---|
| Kirim `configuration.php` | Penerima menyunting kredensial DB-nya | `$secret` ikut terbawa; harus tetap diganti |
| **Tidak dikirim** (disarankan) | Penerima instal Joomla 5.4.7 baru, wizard membuat file itu sendiri | `$secret` baru dan bersih sejak awal |

Yang harus disepakati kalau memilih jalur kedua: **prefix tabel harus `n213k_`**, ditulis
manual di layar database wizard instalasi. Prefix acak bawaan Joomla akan membuat dump tidak
cocok sama sekali.

### Ekstensi yang perlu disebut

✅ Terverifikasi lewat query `n213k_extensions`: **tidak ada ekstensi pihak ketiga.** Semuanya
Joomla bawaan, kecuali satu plugin buatan sendiri:

| Plugin | Status | Catatan |
|---|---|---|
| `system/nextrevalidate` | aktif | Buatan sendiri, **tidak punya paket installer** |
| `webservices/content` | aktif | Wajib, kalau mati seluruh API konten hilang |
| `content/fields`, `system/fields` | aktif | Wajib untuk custom field `icon`, `map`, `parent-service` |
| `system/languagefilter` | **nonaktif** | Sengaja — routing bahasa ditangani Next, bukan Joomla |

Jangan menyalakan `languagefilter`. Dia akan menyisipkan prefix bahasa pada URL Joomla dan
mengacaukan endpoint API yang dipanggil frontend.

---

## Bagian B — Deploy backend (Joomla)

Kebutuhan: PHP 8.1+, MySQL 8 / MariaDB 10.4+, ±120 MB disk.

### 1. Siapkan kode inti

Unduh **Joomla 5.4.7 persis** dari joomla.org — bukan "versi terbaru". ✅ Versi terverifikasi
dari `backend/libraries/src/Version.php`. Dump database membawa nomor versi skema; inti yang
lebih baru akan menuntut migrasi, yang lebih lama akan gagal.

Ekstrak ke web root, lalu timpa dengan dua folder dari repo:

```
plugins/system/nextrevalidate/     ← 3 file
images/                            ← 13 file (customers/, gallery/, logo.png, logo-footer.png, hero.jpg)
```

### 2. Jalankan installer Joomla

Isi seperti biasa, dengan **satu hal yang tidak boleh salah**:

```
Table Prefix:  n213k_
```

Akun admin yang dibuat di sini akan **hilang** setelah langkah 3. Itu normal.

### 3. Impor database

```bash
mysql -uroot -p --default-character-set=utf8mb4 nama_db < joomla_db.sql
```

Dump memakai `--add-drop-table`, jadi tabel hasil instalasi ditimpa bersih.

**Setelah ini, login memakai akun dari lokal, bukan akun yang barusan dibuat:**

```
username: rasyad          (satu-satunya Super User)
password: <minta ke Rasyad>
```

⚠️ Kalau password tidak tersedia, reset lewat CLI Joomla dari root situs:

```bash
php cli/joomla.php user:reset-password --username=rasyad
```

### 4. ✅ Perbaikan nginx — **ini penyebab kegagalan nomor satu**

Kalau memakai nginx, blok PHP standar **tidak akan pernah cocok** dengan URL API Joomla:

```nginx
# SALAH — /api/index.php/v1/content/articles tidak cocok, semua API balas 404
location ~ \.php$ { ... }

# BENAR
location ~ \.php(/|$) { ... }
```

Sebabnya: URL API menaruh path di belakang `index.php` (`index.php/v1/...`), sehingga tidak
berakhir dengan `.php`. Tanpa `(/|$)`, nginx tidak pernah menyerahkannya ke PHP.

Ini nyata dan sudah memakan waktu di lingkungan lokal — lihat CLAUDE.md §7. **Kalau API tiba-tiba
404 di semua endpoint, periksa baris ini sebelum yang lain.**

Apache dengan `.htaccess` bawaan Joomla biasanya sudah benar.

### 5. Hapus cache autoload

```bash
rm administrator/cache/autoload_psr4.php
```

Wajib, karena plugin `nextrevalidate` disalin manual, bukan dipasang lewat installer. Tanpa ini
Joomla melempar *"Class not found"* saat plugin dipanggil.

### 6. Aktifkan API dan buat token baru

1. **System → Global Configuration → Text Filters**: pastikan tidak menyaring konten editor.
2. **System → Plugins**: pastikan `Web Services - Content` aktif.
3. **Users → Manage → rasyad → API Tokens**: klik reset, salin token baru.

⚠️ Token lama dari dump **tidak akan bekerja** kalau `$secret` di `configuration.php` berbeda
(yaitu setiap kali memilih jalur instalasi bersih). Token Joomla diturunkan dari secret situs.
Jangan buang waktu mencoba token lama.

### 7. HTTPS

Wajib. Token dikirim di header `X-Joomla-Token` pada setiap permintaan; tanpa TLS token itu
terbaca siapa pun di jalur jaringan.

### 8. Uji sebelum lanjut

```bash
curl -s -H "X-Joomla-Token: TOKEN_BARU" \
     -H "Accept: application/vnd.api+json" \
     "https://domain-joomla.com/api/index.php/v1/content/articles?filter[category]=10&page[limit]=1" \
     | head -c 300
```

Harus keluar JSON berisi satu artikel. Kalau 404 → kembali ke langkah 4. Kalau 401 → token.
Kalau "Could not match accept header" → header `Accept` hilang.

---

## Bagian C — Deploy frontend (Next.js)

✅ Terverifikasi: `next` 16.3.0, React 19.2.8, dibangun lokal dengan Node 24. Tidak ada field
`engines` di `package.json`, jadi **tentukan versi Node di sisi hosting** — Node 20 LTS ke atas.

### Ini bukan situs statis

`next build` menghasilkan campuran: beranda dan `/services` dipranyatakan (SSG), sedangkan
`/services/[slug]` dirender per permintaan (ƒ). Ditambah ada API route `/api/revalidate`.

**Artinya butuh runtime Node, bukan hosting file statis.** Tidak bisa ditaruh di shared hosting
cPanel biasa berdampingan dengan Joomla.

### Variabel lingkungan

Buat `frontend/.env.local` di server (tidak pernah ada di Git):

```
JOOMLA_API=https://domain-joomla.com/api/index.php/v1
JOOMLA_TOKEN=<token dari Bagian B langkah 6>
REVALIDATE_SECRET=<string acak baru, dipakai lagi di Bagian D>
```

Bangkitkan secret yang layak:

```bash
openssl rand -hex 32
```

### Build

```bash
cd frontend
npm ci
npm run build
npm start          # default port 3000
```

⚠️ **Joomla harus sudah hidup dan bisa dihubungi saat `npm run build` berjalan.** Halaman SSG
mengambil data dari API pada waktu build; kalau Joomla mati, build gagal atau menghasilkan
halaman kosong. Urutannya tidak bisa dibalik: backend dulu, baru frontend.

### Pilihan hosting

| Pilihan | Cocok kalau | Catatan |
|---|---|---|
| **Vercel** | jalur termudah | Push repo, isi 3 env var. `revalidatePath` jalan normal |
| VPS + PM2 | ingin satu server untuk keduanya | `pm2 start npm --name web -- start`, nginx reverse proxy ke :3000 |
| Node hosting lain | — | Pastikan mendukung Next 16 dan proses jangka panjang |

⚠️ Kalau memakai kontainer atau ingin artefak ramping, tambahkan `output: 'standalone'` di
`next.config.ts` (sekarang file itu masih kosong) agar `.next/standalone` bisa dijalankan tanpa
seluruh `node_modules`.

### Sebelum tayang: `metadataBase`

Tanpa domain produksi, tag `hreflang` memakai path relatif dan mesin pencari tidak bisa
memetakan versi bahasa. Tambahkan di `frontend/src/app/[locale]/layout.tsx`:

```ts
export const metadata: Metadata = {
  metadataBase: new URL('https://domain-frontend.com'),
  // …
};
```

---

## Bagian D — Menyambungkan keduanya

Tanpa langkah ini situs tetap jalan, hanya saja perubahan editor baru muncul setelah **60 detik**
(nilai `revalidate` di `joomla.ts`). Dengan langkah ini, ±3 detik.

**System → Plugins → Next Revalidate**, ubah dua parameter:

| Parameter | Dari (nilai lokal di dump) | Menjadi |
|---|---|---|
| `url` | `http://localhost:3000/api/revalidate` | `https://domain-frontend.com/api/revalidate` |
| `secret` | secret lokal | **sama persis** dengan `REVALIDATE_SECRET` di `.env.local` |

⚠️ Dua syarat yang mudah terlewat:

1. **Server Joomla harus bisa menghubungi frontend keluar.** Banyak shared hosting memblokir
   koneksi HTTP keluar. Kalau diblokir, webhook diam-diam gagal dan editor mengira situs rusak.
2. Timeout plugin 5 detik, jadi frontend yang mati **tidak akan** menggagalkan penyimpanan
   artikel. Aman, tapi juga berarti kegagalannya senyap.

Uji manual:

```bash
curl -s "https://domain-frontend.com/api/revalidate?secret=SECRET"
# {"revalidated":true,...}  → sehat
# 403                        → secret tidak cocok
```

---

## Bagian E — Checklist verifikasi

Jalankan berurutan. Setiap baris menguji hal berbeda; jangan dilewati.

| # | Uji | Harus |
|---|---|---|
| 1 | `curl` endpoint API (Bagian B langkah 8) | JSON, bukan 404 |
| 2 | Buka `/` | Hero, About, 6 layanan, logo klien, kantor |
| 3 | Buka `/services` | **10** layanan |
| 4 | Buka `/en/services` dan `/zh/services` | 10 layanan, **urutan sama** dengan `/` |
| 5 | Buka `/services/digital-printing` | 14 sub-layanan + gambar hero |
| 6 | Ganti bahasa di halaman itu | Tetap di halaman yang sama, **bukan 404** |
| 7 | Buka `/services/offset-printing` di 3 bahasa | **16** sub-layanan di ketiganya |
| 8 | Klik logo klien / buka footer | Gambar tampil, bukan ikon rusak |
| 9 | Ubah judul artikel di Joomla, simpan | Muncul di situs dalam ±5 detik |
| 10 | Buka `/fr` | 404 |

Uji #4, #5, #6, dan #7 penting karena masing-masing pernah gagal karena bug berbeda:
urutan per bahasa, batas `page[limit]`, id artikel di URL, dan paging. Kalau salah satu meleset,
lihat riwayat Git untuk konteksnya.

---

## Bagian F — Jebakan khusus proyek ini

**ID kategori ditulis mati di kode.** `CATEGORY` di `frontend/src/lib/joomla.ts` memuat angka
2, 8, 9, 10, 11, 12, 13, 14, 15. Kalau konten dibuat ulang manual alih-alih di-restore dari
dump, ID-nya akan berbeda dan **frontend menampilkan halaman kosong tanpa satu pun pesan error**.
Selalu restore dump.

**Alias adalah identitas.** Setiap artikel berakhiran `-id`, `-en`, atau `-zh`. Jangan
mengubahnya lewat admin; itu memutus hubungan antar terjemahan dan halaman detail jadi 404.

**Gambar dilayani langsung oleh Joomla.** `mediaUrl()` menurunkan URL-nya dari `JOOMLA_API`,
jadi domain gambar ikut berubah otomatis. Konsekuensinya: folder `images/` Joomla **harus bisa
diakses publik**, dan kalau Joomla di balik autentikasi, semua gambar hilang.

**Setiap bahasa baru mengalikan isi kategori.** Kategori 15 sekarang 258 artikel (86 × 3).
`joomlaPaged()` sudah menangani paging, tapi ingat angka ini kalau menambah bahasa keempat.

**Token tidak boleh sampai ke browser.** Pengambilan data hanya di server component. Jangan
pernah menambahkan prefix `NEXT_PUBLIC_` pada `JOOMLA_TOKEN`.

---

## Rollback

Backup sebelum menyentuh apa pun:

```bash
mysqldump -uroot -p --default-character-set=utf8mb4 --add-drop-table nama_db > backup-$(date +%F).sql
tar czf images-$(date +%F).tar.gz images/
```

Memulihkan = impor dump + kembalikan `images/`. Kode inti Joomla tidak perlu di-backup; unduh
ulang 5.4.7. Frontend cukup `git checkout` commit sebelumnya lalu build ulang.

---

## Yang masih belum ada

Jujur soal ini, karena memengaruhi risiko deploy:

- Tidak ada staging — perubahan langsung ke produksi
- Tidak ada test otomatis dan tidak ada CI
- Tidak ada monitoring; frontend mati baru ketahuan saat ada yang membuka situs
- Tidak ada halaman 404 kustom
- Terjemahan Mandarin belum diperiksa penutur asli ([08 — Operasional](08-operasional.md))
