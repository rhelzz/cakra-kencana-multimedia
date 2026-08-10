# 04 — Panduan Editor (CRUD)

Panduan mengubah isi situs **tanpa menyentuh kode**. Semua dilakukan dari
http://company-profile.test/backend/administrator

## Aturan yang berlaku di semua section

1. **Status harus Published.** Artikel berstatus Unpublished/Archived/Trashed tidak muncul.
2. **Bahasa wajib diisi** — `Bahasa Indonesia`, `English`, `中文`, atau `All`.
   Artikel tanpa bahasa yang benar bisa muncul di locale yang salah atau tidak muncul sama sekali.
3. **Kategori menentukan section.** Salah kategori = muncul di tempat yang salah.
4. **Urutan** diatur lewat drag-and-drop di daftar artikel (kolom `⋮⋮`). Urutkan berdasarkan
   kolom **Ordering** dulu, kalau tidak, drag-nya tidak aktif.
5. **Teks ditulis di editor utama**, sebelum tombol *Read more*.
6. Perubahan muncul di situs **dalam hitungan detik**. Kalau lebih dari semenit, lihat
   [08 — Operasional](08-operasional.md#kalau-perubahan-tidak-muncul).

> **Menerjemahkan = membuat artikel baru**, bukan mengganti bahasa artikel yang ada.
> Alias-nya harus sama persis, hanya beda akhiran `-id` / `-en` / `-zh`.

---

## Hero (bagian paling atas)

**Content → Articles**, cari alias `home-hero-id` (dan `-en`, `-zh`).

| Yang tampil | Diambil dari |
|---|---|
| Judul besar | **Title** artikel |
| Kalimat di bawahnya | isi editor |
| Foto latar | tab **Images and Links** → **Full Article Image** |

### Update
1. Buka artikel → ubah Title dan/atau isi → **Save**.
2. Ganti foto: tab **Images and Links** → **Full Article Image** → Select → pilih/unggah.
3. **Ulangi untuk ketiga bahasa** kalau ingin semuanya berubah.

### Ganti foto hero untuk semua bahasa sekaligus
Cara paling singkat: unggah file baru dengan **nama yang sama** (`hero.jpg`) lewat
**Content → Media**, timpa yang lama. Ketiga artikel menunjuk path yang sama, jadi ketiganya
ikut berubah tanpa disunting.
Setelah itu tekan **Ctrl+F5** di browser — nama file tidak berubah, jadi browser masih
menyimpan versi lama.

### Create / Delete
Jangan. Hero harus tepat satu per bahasa. Menghapusnya membuat seluruh section hero hilang
(komponennya mengembalikan kosong kalau artikel tidak ditemukan).

---

## About (Who we are / Service area / Why choose us)

Kategori **About**. Satu artikel = satu blok. Judul artikel jadi `<h2>`.

### Create — menambah blok baru
1. **Content → Articles → New**
2. **Title**: judul blok, mis. `Legalitas`
3. **Category**: `About`
4. **Alias**: `about-legalitas-id` (akhiran bahasa wajib)
5. **Language**: `Bahasa Indonesia`
6. Isi editor:
   - **paragraf biasa** → tampil sebagai teks
   - **bullet list** (tombol daftar di toolbar) → tampil sebagai **checklist ikon centang merah**
7. **Save**, lalu atur urutannya lewat drag-and-drop.
8. Ulangi untuk `-en` dan `-zh` bila perlu.

### Update
Buka artikel, ubah Title/isi, Save. Mengubah bullet list jadi paragraf (atau sebaliknya)
otomatis mengubah bentuk tampilannya.

### Delete
Trash artikelnya. Blok itu hilang, blok lain tetap. Kalau **semua** artikel About dihapus,
seluruh section About hilang dari halaman.

---

## Carousel (galeri di sebelah About)

Kategori **Gallery**. Satu artikel = satu slide. Berbahasa `All`.

| Yang tampil | Diambil dari |
|---|---|
| Gambar slide | tab **Images and Links** → **Intro Image** |
| Teks `alt` | **Intro Image → Image Description (Alt)**, cadangan: Title |

### Create — menambah slide
1. **New** → Title mis. `Finishing`
2. **Category**: `Gallery`
3. **Language**: `All`
4. Tab **Images and Links** → **Intro Image** → pilih gambar → isi **Image Description (Alt)**
5. **Save** → atur urutan lewat drag-and-drop

Slide bertambah otomatis. Panah dan titik navigasi mengikuti jumlah slide; kalau tinggal
1 slide, keduanya hilang sendiri dan autoplay berhenti.

### Delete
Trash artikelnya.

### Catatan
- Autoplay 5 detik, berhenti saat kursor di atasnya atau saat difokus keyboard.
- Rasio tampilan 4:3, gambar dipotong `object-cover`. Taruh objek penting di tengah.
- **Kompres gambar sebelum unggah.** Belum ada optimasi otomatis; foto 2 MB akan dikirim apa adanya.

---

## Services (kartu layanan + halaman detail)

Kategori **Services**. Satu artikel = satu kartu **dan** satu halaman detail di `/services/{id}`.

| Yang tampil | Diambil dari |
|---|---|
| Judul kartu & judul halaman detail | **Title** |
| Deskripsi singkat di kartu | isi editor |
| Ikon | custom field **Icon** (tab **Fields**) |

### Create — menambah layanan
1. **New** → Title mis. `Neon box`
2. **Category**: `Services`
3. **Alias**: `service-neon-box-id`
4. **Language**: `Bahasa Indonesia`
5. Tab **Fields** → **Icon** → pilih dari dropdown
6. Isi editor dengan deskripsi singkat (1–2 kalimat; ini yang tampil di kartu)
7. **Save** → atur urutan

Kartu baru langsung muncul, lengkap dengan tombol *Selengkapnya* ke halaman detailnya.

### Mengisi halaman detail
Halaman detail saat ini **tipis**, karena artikel hanya berisi deskripsi singkat. Untuk
membuatnya berisi:

1. Buka artikel, letakkan kursor setelah paragraf pembuka
2. Klik tombol **Read more** di toolbar editor
3. Tulis penjelasan panjang **di bawah** garis Read more

Bagian sebelum Read more = teks kartu. Bagian sesudahnya = isi halaman detail.

### Ikon tidak sesuai keinginan?
Pilihan dropdown-nya terbatas 23 (lihat [03 — Model Konten](03-model-konten.md#pilihan-field-icon)).
Menambah pilihan baru **butuh developer** — harus diubah di kode dan di Joomla sekaligus.

### Delete
Trash artikelnya. Kartunya hilang; halaman detailnya jadi 404 (bukan error, memang begitu).

---

## Our customers (deretan logo)

Kategori **Our customers**. Berbahasa `All`.

| Yang tampil | Diambil dari |
|---|---|
| Logo | tab **Images and Links** → **Intro Image** |
| `alt` logo | **Title** |

### Create
1. **New** → Title = nama perusahaan
2. **Category**: `Our customers`, **Language**: `All`
3. **Intro Image** → unggah logo → **Save**

### ⚠ Syarat bentuk logo
Logo diratakan jadi **putih solid** di atas latar gelap, supaya deretannya seragam. Ini hanya
bekerja untuk logo **wordmark / outline**.

**Logo blok terisi dengan huruf berlubang (knockout) akan jadi gumpalan putih tanpa bentuk.**
Ini benar-benar terjadi pada logo Indosat Ooredoo versi kotak kuning-merah, dan diperbaiki
dengan mengganti ke versi wordmark.

Kalau logo klien memang berbentuk blok, pilihannya: cari varian wordmark-nya, atau minta
developer mematikan filter putih untuk semua logo.

### Delete
Trash artikelnya.

---

## Our offices (daftar lokasi)

Kategori **Our offices**.

| Yang tampil | Diambil dari |
|---|---|
| Nama lokasi | **Title** |
| Alamat | isi editor |
| Ikon | field **Icon** (`building` / `warehouse`) |
| Tombol **Buka Peta** | field **Map link** |

### Create
1. **New** → Title mis. `Workshop IV`
2. **Category**: `Our offices`, alias `office-workshop-iv-id`, Language sesuai
3. Isi editor dengan alamat lengkap
4. Tab **Fields**:
   - **Icon** → `Office / building` atau `Workshop / warehouse`
   - **Map link** → tempel URL Google Maps
5. **Save** → atur urutan

**Field Map link dikosongkan = tombol Buka Peta tidak muncul.** Ini disengaja — dipakai
Workshop III yang isinya daftar kota, bukan satu alamat.

### Penting: kantor pertama muncul di footer
Footer menampilkan **kantor pertama sesuai urutan**. Kalau kamu drag kantor lain ke posisi
teratas, alamat di footer ikut berubah.

### Delete
Trash artikelnya. Kalau yang dihapus kantor pertama, footer otomatis memakai kantor berikutnya.

---

## Social media (ikon di footer)

Kategori **Social**. Berbahasa `All`.

| Yang tampil | Diambil dari |
|---|---|
| Ikon | field **Icon** |
| Tujuan link | field **Link** |
| Tooltip / `aria-label` | **Title** |

### Create
1. **New** → Title mis. `LinkedIn`
2. **Category**: `Social`, **Language**: `All`
3. Tab **Fields** → **Icon** dan **Link** (URL profil lengkap)
4. **Save**

**Field Link kosong = ikonnya tidak ditampilkan sama sekali.** Disengaja, supaya tidak ada
ikon yang mengarah ke halaman kosong.

### LinkedIn
Ikon resmi LinkedIn **tidak tersedia** di library brand yang dipakai (dihapus atas permintaan
LinkedIn sendiri). Entri LinkedIn akan memakai ikon globe. Pilih `Website / other` supaya
konsisten.

### URL sekarang masih dummy
Kelima akun (`facebook.com/cakrakencanamultimedia`, dst.) adalah placeholder. **Ganti dengan
URL asli sebelum situs dipublikasikan.**

---

## Judul section ("Layanan kami", "Klien kami", "Kantor kami")

Kategori **Headings**. Satu artikel per judul per bahasa; hanya **Title**-nya yang dipakai.

| Alias | Mengatur judul |
|---|---|
| `heading-services-id` / `-en` / `-zh` | section Services |
| `heading-customers-id` / `-en` / `-zh` | section Our customers |
| `heading-offices-id` / `-en` / `-zh` | section Our offices |

### Update
Ubah **Title**-nya, Save. Itu saja.

Judul section **About** tidak ada di sini — yang tampil adalah judul tiap artikel About.
Label kecil "Tentang kami" di atasnya ada di kode (lihat [07 — Frontend](07-frontend.md#label-antarmuka)).

---

## Footer

| Bagian | Sumbernya |
|---|---|
| Logo | file `images/logo.png` di **Content → Media** |
| Kalimat di bawah logo | subjudul artikel `home-hero` |
| Ikon sosmed | kategori **Social** |
| Judul kolom navigasi | label antarmuka (di kode) |
| Daftar link | **Menus → Main Menu** |
| Alamat | kantor **pertama** di kategori Our offices |
| Baris hak cipta | artikel `footer-copyright` |

### Mengganti logo
**Content → Media** → unggah file bernama `logo.png`, timpa yang lama. Navbar dan footer
ikut berubah, tanpa deploy ulang. Tekan Ctrl+F5.

### Mengubah baris hak cipta
Sunting artikel `footer-copyright`. Tulis `{year}` di tempat tahun — otomatis diganti tahun
berjalan, jadi tidak perlu disunting lagi tiap Januari.

---

## Menu navigasi

**Menus → Main Menu**.

### Create — menambah item menu
1. **New**
2. **Menu Item Type** → **System Links → URL**
3. **Link**: `#offices` (harus cocok dengan `id` section di halaman)
4. **Title**: teks yang tampil
5. **Language**: pilih satu bahasa (jangan `All`, nanti dobel di semua bahasa)
6. **Save**

`id` section yang tersedia: `#top`, `#about`, `#services`, `#customers`, `#offices`.

> Section **Our offices** sudah punya `id="offices"` tapi **belum ada item menunya** —
> tambahkan dengan langkah di atas kalau mau muncul di navbar.

### ⚠ Batasan
**Mengubah item menu lewat API selalu gagal (error 500)** — bug Joomla. Lewat admin UI aman.
Kalau ada skrip otomatis yang perlu mengubah menu, harus lewat SQL langsung.

Item menu berlaku untuk navbar **dan** kolom navigasi di footer sekaligus.

---

## Menambah bahasa keempat

Bukan pekerjaan editor — butuh developer. Yang harus dikerjakan:
1. Buat Content Language baru di Joomla
2. Tambah kode locale di `frontend/src/lib/i18n.ts` (termasuk seluruh kamus label `UI`)
3. Duplikasi semua artikel dengan akhiran alias baru
4. Buat set item menu baru

Perkiraan: ±40 artikel baru.
