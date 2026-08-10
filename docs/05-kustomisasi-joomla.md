# 05 — Kustomisasi Joomla

Daftar lengkap **semua yang menyimpang dari Joomla 5 standar**. Kalau situs dipasang ulang di
server lain, ini yang harus direproduksi.

Ringkasnya: kita **tidak mengubah satu pun file core Joomla**. Yang ada hanya satu plugin
buatan sendiri, tiga custom field, tujuh kategori, sedikit konfigurasi, dan satu perbaikan
nginx di luar Joomla.

---

## 1. Plugin `plg_system_nextrevalidate`

Satu-satunya kode PHP buatan kita.

**Lokasi:** `backend/plugins/system/nextrevalidate/`

```
nextrevalidate.xml              manifest + form konfigurasi (url, secret)
services/provider.php           service provider (pola plugin Joomla 5)
src/Extension/NextRevalidate.php  logikanya
```

**Tugasnya:** memberi tahu frontend Next.js agar membuang cache begitu konten berubah,
supaya editor tidak menunggu 60 detik.

**Event yang didengarkan:**

| Event | Terpicu saat |
|---|---|
| `onContentAfterSave` | artikel/kategori disimpan |
| `onContentAfterDelete` | konten dihapus |
| `onContentChangeState` | publish / unpublish |
| `onExtensionAfterSave` | item menu disimpan (menu itu "extension", bukan "content") |

**Yang dilakukan:** POST ke `{url}?secret={secret}`, timeout 5 detik.

**Perilaku saat gagal:** ditangkap, ditampilkan sebagai warning di admin. **Menyimpan di
Joomla tidak pernah gagal gara-gara frontend mati.** Ini disengaja.

**Konfigurasi:** **System → Plugins → Next Revalidate** — field `url` dan `secret`.
Kalau port dev bergeser (mis. ke 3001), **ubah di sini, bukan di kode.**

**Cara pendaftarannya:** tidak lewat installer, melainkan satu baris `INSERT` ke tabel
`n213k_extensions` (SQL lengkapnya di [02 — Setup](02-setup.md#mendaftarkan-plugin-nextrevalidate)).
Setelah itu **wajib** menghapus `backend/administrator/cache/autoload_psr4.php`, kalau tidak
Joomla melaporkan `Class not found` walau file plugin sudah ada.

---

## 2. Custom Fields

**Content → Fields**, konteks `com_content.article`.

| Nama | Tipe | Kategori | Alasan dibuat |
|---|---|---|---|
| `icon` | List (23 opsi) | Services, Offices, Social | Memilih ikon tanpa menyentuh kode |
| `map` | URL | Offices | Link Google Maps per lokasi |
| `link` | URL | Social | URL profil sosmed |

### Kenapa `map` tidak memakai "Link A" bawaan Joomla

Awalnya link peta disimpan di `urls.urla` (tab **Images and Links**) — tempat yang paling
natural. Datanya **tersimpan benar di database**, tetapi:

- endpoint **artikel tunggal** mengembalikan `urls` ✓
- endpoint **daftar artikel** tidak mengembalikannya sama sekali ✗

Section Offices mengambil semua kantor dalam satu panggilan daftar, jadi link peta tidak
pernah sampai. Pilihannya: 4 request terpisah, atau pindah ke custom field yang memang ikut
muncul di daftar. Diambil yang kedua.

**Pelajaran yang berlaku umum: custom field muncul di endpoint daftar, `urls` tidak.**

---

## 3. Kategori

Tujuh kategori dibuat sebagai wadah section. Semuanya berbahasa `All`.

| ID | Judul | Alias |
|---|---|---|
| 8 | Gallery | `gallery` |
| 9 | About | `about` |
| 10 | Services offered | `services` |
| 11 | Our customers | `customers` |
| 12 | Our offices | `offices` |
| 13 | Social | `social` |
| 14 | Headings | `headings` |

Kategori 2 (`Uncategorised`) bawaan Joomla dipakai untuk `home-hero` dan `footer-copyright`.

> **ID-nya dipakai di dalam kode** (`CATEGORY` di `frontend/src/lib/joomla.ts`).
> Menghapus lalu membuat ulang kategori akan mengubah ID dan mematikan section terkait.

---

## 4. Content Languages

**System → Content Languages** — dua bahasa ditambahkan:

| Kode | SEF | Judul |
|---|---|---|
| `id-ID` | `id` | Bahasa Indonesia |
| `zh-CN` | `zh` | 中文 (简体) |

`en-GB` sudah ada dari instalasi.

**Paket bahasa Joomla sengaja tidak diinstal.** Kita tidak memakai frontend maupun
terjemahan antarmuka Joomla — content language hanya dipakai sebagai penanda pada artikel.

**Plugin `System - Language Filter` tidak diaktifkan.** Itu untuk routing multibahasa di
frontend Joomla, yang tidak kita pakai. Routing bahasa ditangani `frontend/src/proxy.ts`.

---

## 5. Global Configuration

| Setting | Nilai | Alasan |
|---|---|---|
| Site Name | `Cakra Kencana Multimedia` | Semula `company-profile` (default instalasi). Dipakai frontend untuk `alt` logo dan metadata. |

Selebihnya default.

---

## 6. Menu

**Menus → Main Menu** — 10 item, empat berbahasa Inggris (bawaan + tambahan) dan enam
tambahan untuk Indonesia & Mandarin. Semuanya bertipe **URL** kecuali "Home" versi Inggris
yang masih bertipe *component* bawaan instalasi.

Item component itu dipetakan ke `#top` di dalam kode (`hrefFor()` di `joomla.ts`), karena
**PATCH item menu lewat API selalu balas 500** sehingga tipenya tidak bisa diubah otomatis.
Kalau kamu ubah manual di admin jadi tipe URL `#top`, baris pemetaan itu boleh dihapus.

---

## 7. Media

Berkas yang kita unggah ke `backend/images/`:

```
logo.png                    logo perusahaan (navbar + footer)
hero.jpg                    latar hero
gallery/offset-press.jpg    ┐
gallery/screen-printing.jpg │ 4 slide carousel
gallery/color-proofing.jpg  │
gallery/paper-stock.jpg     ┘
customers/pgn.png           ┐
customers/indosat.png       │
customers/daihatsu.png      │ 6 logo klien
customers/ahm.png           │
customers/mandiri.png       │
customers/telkom.png        ┘
```

Sisa isi `backend/images/` (`banners/`, `headers/`, `sampledata/`, `joomla_black.png`,
`powered_by.png`) adalah bawaan Joomla dan tidak dipakai.

**Catatan hak cipta:** logo klien adalah merek dagang perusahaan lain, dipakai di sini
sebagai konten contoh. Foto dari Unsplash (lisensinya membebaskan penggunaan komersial).
Untuk produksi, pastikan ada izin menampilkan logo klien.

---

## 8. Di luar Joomla: perbaikan nginx

Bukan kustomisasi Joomla, tapi **tanpa ini seluruh API mati.**

`C:\laragon\etc\nginx\sites-enabled\company-profile.test.conf`:

```nginx
location ~ \.php(/|$) {     # standarnya \.php$
```

File `auto.company-profile.test.conf` di-rename jadi `.bak` supaya Laragon tidak
menimpanya kembali. Penjelasan lengkap di [02 — Setup](02-setup.md#perbaikan-nginx-yang-wajib-ada).

---

## 9. Yang **tidak** kita lakukan

Supaya jelas batasnya:

- ❌ Tidak ada file core Joomla yang diubah
- ❌ Tidak ada template Joomla yang dibuat atau disunting
- ❌ Tidak ada komponen atau modul buatan sendiri
- ❌ Tidak ada tabel database buatan sendiri
- ❌ Tidak ada extension pihak ketiga yang dipasang
- ❌ Tidak memakai fitur Associations multibahasa Joomla
- ❌ Tidak memakai plugin Language Filter

Artinya `joomla update` bisa dijalankan tanpa merusak apa pun. Yang perlu diperiksa setelah
update hanyalah plugin kita masih terdaftar dan cache autoloader sudah dibersihkan.

---

## Checklist reproduksi di server baru

1. Pasang Joomla 5.4.7, buat database, jalankan instalasi
2. Perbaiki `location ~ \.php(/|$)` di konfigurasi web server
3. Aktifkan plugin Web Services: Content, Menus, Languages, Fields, Config
4. Buat API token untuk Super User
5. Tambah Content Language `id-ID` dan `zh-CN`
6. Ubah Site Name
7. Buat 7 kategori — **catat ID-nya**, lalu samakan `CATEGORY` di `joomla.ts`
8. Buat 3 custom field beserta opsinya, pasang ke kategori yang sesuai
9. Salin folder plugin, daftarkan lewat SQL, hapus `autoload_psr4.php`
10. Isi URL dan secret di **System → Plugins → Next Revalidate**
11. Unggah media ke `images/`
12. Buat artikel dan item menu (atau restore dump database)
13. Isi `frontend/.env.local`, jalankan `npm install` lalu `npm run dev`

Langkah 7 adalah yang paling rawan — ID kategori hampir pasti berbeda di instalasi baru.
