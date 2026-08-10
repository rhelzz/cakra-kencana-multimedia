# 02 — Setup & Instalasi

## Menjalankan yang sudah ada

1. **Nyalakan Laragon** (nginx + MySQL). Keduanya wajib hidup — kalau MySQL mati, Joomla mati,
   dan frontend melempar error karena API-nya 500.
2. `cd frontend && npm run dev` → http://localhost:3000

| Alamat | Untuk |
|---|---|
| http://localhost:3000 | Situs (yang dilihat pengunjung) |
| http://company-profile.test/backend/administrator | Admin Joomla |
| http://company-profile.test/backend/api/index.php/v1 | API |

**Selalu pakai vhost `company-profile.test`, jangan `localhost/company-profile/...`** —
hanya vhost itu yang punya perbaikan nginx di bawah.

## Variabel environment

`frontend/.env.local` (tidak masuk git — contohnya ada di `frontend/.env.example`):

```env
JOOMLA_API=http://company-profile.test/backend/api/index.php/v1
JOOMLA_TOKEN=<token dari Joomla>
REVALIDATE_SECRET=<string acak, harus sama dengan param plugin>
```

**Membuat `JOOMLA_TOKEN`:** admin Joomla → **Users → Manage** → klik user Super User →
tab **API Tokens** → Enable → salin token yang muncul (hanya ditampilkan sekali).

**`REVALIDATE_SECRET`:** bebas, mis. `openssl rand -hex 16`. Nilai yang sama harus diisi di
**System → Plugins → Next Revalidate**.

## Prasyarat di sisi Joomla

Plugin bawaan yang harus **Enabled** (default sudah aktif):

- `System - Web Services` untuk **Content**, **Menus**, **Languages**, **Fields**, **Config**
- `System - Fields` (agar nilai custom field ikut keluar di API)

Cek di **System → Plugins**, filter kata "web services".

## Perbaikan nginx yang wajib ada

Ini penyebab kegagalan paling sering dan paling membingungkan. Konfigurasi Laragon standar:

```nginx
location ~ \.php$ { ... }
```

Pola `\.php$` **tidak cocok** dengan `/api/index.php/v1/content/articles`, karena URL-nya
tidak berakhiran `.php`. Akibatnya request jatuh ke `try_files` dan nginx membalas **404
sebelum PHP dijalankan sama sekali** — token dan plugin yang benar pun tidak menolong.

Perbaikannya satu karakter regex, di
`C:\laragon\etc\nginx\sites-enabled\company-profile.test.conf`:

```nginx
# (/|$) supaya PATH_INFO Joomla /api/index.php/v1/... sampai ke PHP
location ~ \.php(/|$) {
    include snippets/fastcgi-php.conf;
    fastcgi_pass php_upstream;
}
```

File aslinya bernama `auto.company-profile.test.conf` dan **ditulis ulang oleh Laragon setiap
restart**. Karena itu file tersebut sudah di-rename jadi `auto.company-profile.test.conf.bak`,
dan yang aktif adalah versi tanpa awalan `auto.`.

Setelah mengubah: `nginx -t` lalu `nginx -s reload` (dari `C:\laragon\bin\nginx\nginx-1.22.0`).

> **Kalau semua endpoint API tiba-tiba 404, cek file ini lebih dulu.** Kemungkinan Laragon
> membuat ulang file `auto.` dan menimpanya.

## Mendaftarkan plugin nextrevalidate

Plugin ini tidak dipasang lewat installer, melainkan didaftarkan langsung ke tabel
`n213k_extensions`. Kalau perlu memasang ulang (mis. di server baru):

```sql
INSERT INTO n213k_extensions
  (package_id, name, type, element, folder, client_id, enabled, access,
   protected, locked, manifest_cache, params, custom_data, ordering, state)
VALUES
  (0, 'plg_system_nextrevalidate', 'plugin', 'nextrevalidate', 'system', 0, 1, 1,
   0, 0,
   '{"name":"plg_system_nextrevalidate","type":"plugin","version":"1.0.0","namespace":"Joomla\\\\Plugin\\\\System\\\\NextRevalidate","filename":"nextrevalidate"}',
   '{"url":"http://localhost:3000/api/revalidate","secret":"ISI_SECRET_DI_SINI"}',
   '', 0, 0);
```

Lalu **hapus cache autoloader**, kalau tidak akan muncul `Class ... not found`:

```
del backend\administrator\cache\autoload_psr4.php
```

Kolom `custom_data` wajib diisi (walau string kosong) — tanpa itu MySQL menolak karena kolom
tersebut tidak punya nilai default.

## Membuat bahasa konten

Bahasa konten dibuat lewat API (atau **System → Content Languages**). Yang aktif sekarang:

| Kode | SEF | Judul |
|---|---|---|
| `id-ID` | `id` | Bahasa Indonesia |
| `en-GB` | `en` | English |
| `zh-CN` | `zh` | 中文 (简体) |

Paket bahasa Joomla tidak perlu diinstal — kita tidak memakai frontend Joomla, hanya butuh
*content language* untuk menandai artikel.

## Pemeriksaan sebelum menganggap selesai

```bash
cd frontend
npx tsc --noEmit     # harus tanpa output
npm run lint         # harus tanpa error
```

Keduanya wajib bersih. Tidak ada test otomatis di proyek ini.

## Troubleshooting

| Gejala | Sebab paling mungkin |
|---|---|
| Semua endpoint API 404 (halaman nginx) | Perbaikan `\.php(/|$)` hilang — lihat di atas |
| API balas `{"errors":[{"code":403}]}` | Token salah, kedaluwarsa, atau plugin Web Services mati |
| `Could not match accept header` | POST/PATCH tanpa header `Accept: application/vnd.api+json` |
| `Class ... NextRevalidate not found` | Cache `autoload_psr4.php` belum dihapus |
| Frontend 500 di semua halaman | MySQL mati, atau `JOOMLA_API` menunjuk ke `localhost/...` bukan vhost |
| Konten berubah di Joomla tapi situs tetap lama | Cek URL & secret di **System → Plugins → Next Revalidate**; port dev bisa bergeser ke 3001 |
| Gambar baru tidak muncul | Nama file sama → cache browser. Ctrl+F5 |
| `Another next dev server is already running` | Sudah ada dev server hidup di port 3000; pakai itu |
