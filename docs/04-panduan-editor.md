# 04 — Panduan Editor (CRUD)

Panduan mengubah isi situs **tanpa menyentuh kode**. Semua dilakukan dari
http://company-profile.test/backend/administrator

## Aturan yang berlaku di semua section

1. **Status harus Published.** Artikel berstatus Unpublished/Archived/Trashed tidak muncul.
   Meng-unpublish versi Indonesia menghilangkan item itu dari `/` saja — versi Inggris dan
   Mandarinnya tetap tayang di `/en` dan `/zh`. Untuk menyembunyikannya dari semua bahasa,
   unpublish ketiga-tiganya.
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

## About (Mengapa Cakra / Wilayah Kami)

Satu kategori: **About Features** (4 fitur: judul + deskripsi + ikon). Satu artikel = satu kartu. Judul artikel jadi judul
kartu; ikon dipilih di tab **Fields → Icon**. Bagian Wilayah Kami (Coverage) hanya memakai artikel heading + peta, tanpa item statistik.

### Create — menambah item baru
1. **Content → Articles → New**
2. **Title**: mis. `Garansi Pengerjaan`
3. **Category**: `About Features`
4. **Alias**: akhiran bahasa wajib (`-id`, `-en`, `-zh`)
5. **Language**: sesuai alias
6. Isi editor dengan 1–2 kalimat deskripsi
7. Tab **Fields** → **Icon**: pilih ikon yang cocok
8. **Save**, lalu atur urutannya lewat drag-and-drop **artikel `-id`**
9. Ulangi untuk `-en` dan `-zh` bila perlu.

### Update
Buka artikel, ubah Title/isi/ikon, Save.

### Delete
Unpublish artikelnya (jangan hapus). Item itu hilang, item lain tetap.

> Kategori lama **About** (3 blok teks) sudah pensiun dan tidak tampil di situs.

---

## Services (tile layanan + halaman daftar)

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

## Sub-service (produk di dalam service)

Kategori **Service sub-items**. Satu artikel sub-service menjadi satu kartu pada halaman
detail service induknya.

### Create — menambah sub-service

1. **Content → Articles → New**
2. Isi **Title**, misalnya `Roll Up Banner`
3. Pilih **Category**: `Service sub-items`
4. Pilih **Language** sesuai bahasa artikel
5. Isi deskripsi singkat di editor
6. Tab **Fields** → **Parent service** → pilih service induknya, misalnya `Digital Printing`
7. Pastikan status **Published**, lalu **Save**

Field **Parent service** adalah relasi utamanya. Alias hanya digunakan untuk identitas artikel
dan terjemahan; alias tidak menentukan sub-service masuk ke service mana.

Contoh:

```text
Roll Up Banner
Parent service: Digital Printing
        ↓
muncul di halaman Digital Printing
```

Untuk mempercepat pengisian banyak item, gunakan **Save as Copy** dari sub-service yang sudah
benar. Ubah Title, Alias, dan deskripsi, lalu periksa kembali Parent service sebelum Save.

### Terjemahan sub-service

Buat artikel baru untuk bahasa lain. Gunakan alias yang sama dengan suffix berbeda:

```text
subservice-digital-printing-roll-up-banner-id
subservice-digital-printing-roll-up-banner-en
subservice-digital-printing-roll-up-banner-zh
```

Parent service tetap menunjuk ke service induk yang sama.

---

## Our customers (deretan logo)

Kategori **Our customers**. Berbahasa `All`.

| Yang tampil | Diambil dari |
|---|---|
| Logo | tab **Images and Links** → **Intro Image** *atau* **Full Article Image** |
| `alt` logo | **Title** |

### Create
1. **New** → Title = nama perusahaan
2. **Category**: `Our customers`, **Language**: `All`
3. **Intro Image** → unggah logo → **Save**

### ⚠ Syarat bentuk logo
Logo ditampilkan dengan **warna aslinya** di atas bidang putih netral. Gunakan PNG transparan
dengan ruang kosong secukupnya agar ukuran visual antarmerek tetap seimbang.

### Delete
Trash artikelnya.

### Urutan dan tampilan 84 logo

Delapan belas artikel pertama menjadi logo unggulan dalam marquee di beranda. Tombol di bawahnya
membuka halaman **Klien Kami** yang menampilkan seluruh logo. Ubah **Ordering** artikel untuk
memilih logo unggulan; tidak perlu mengubah kode.

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

### Penting: Kantor Pusat muncul di footer
Footer selalu menampilkan artikel **Kantor Pusat** berdasarkan alias
`office-head-office`. Mengubah urutan kantor hanya mengubah urutan pada section Offices,
bukan alamat footer.

### Delete
Trash artikelnya. Jangan menghapus artikel Kantor Pusat jika alamat footer masih diperlukan.

---

## Contact Us

Kategori **Contact**. Setiap kontak dibuat tiga kali dengan alias dasar yang sama dan akhiran
`-id`, `-en`, serta `-zh`.

| Yang tampil | Diambil dari |
|---|---|
| Nama kontak | **Title** |
| Nomor telepon / email | isi editor |
| Tujuan klik | field **Link** |

Untuk menambah WhatsApp, buat tiga artikel terjemahan, isi nomor pada editor, lalu isi field
**Link** dengan format `https://wa.me/62...` tanpa tanda `+`, spasi, atau strip. Artikel
`request-compro-*` dirender sebagai CTA terpisah; Title menjadi label tombol, isi editor menjadi
deskripsinya, dan field **Link** menjadi tujuan tombol. Link kosong membuat item tidak tampil.

Judul section diatur melalui `heading-contact-id`, `heading-contact-en`, dan
`heading-contact-zh` pada kategori **Headings**.

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

### Status akun
Instagram, Facebook, dan WhatsApp sudah memakai akun asli perusahaan.
**YouTube dan TikTok field Link-nya sengaja dikosongkan** karena akun resminya belum
ditemukan — ikonnya otomatis tidak tampil. Isi field Link-nya kalau akunnya sudah ada.

---

## Judul section ("Layanan kami", "Klien kami", "Kantor kami")

Kategori **Headings**. Satu artikel per judul per bahasa; hanya **Title**-nya yang dipakai.

| Alias | Mengatur judul |
|---|---|
| `heading-services-id` / `-en` / `-zh` | section Services |
| `heading-customers-id` / `-en` / `-zh` | section Our customers |
| `heading-offices-id` / `-en` / `-zh` | section Our offices |
| `heading-contact-id` / `-en` / `-zh` | section Contact Us |

### Update
Ubah **Title**-nya, Save. Itu saja.

Judul section **About** tidak ada di sini — yang tampil adalah judul tiap artikel About.
Label kecil "Tentang kami" di atasnya ada di kode (lihat [07 — Frontend](07-frontend.md#label-antarmuka)).

---

## Footer

| Bagian | Sumbernya |
|---|---|
| Logo | file `images/logo-footer.png` di **Content → Media** (di atas ubin putih) |
| Kalimat di bawah logo | artikel `footer-tagline` (baris 1 = Title, baris 2 = isi) |
| Ikon sosmed | kategori **Social** (hanya yang ada URL-nya yang tampil) |
| Daftar link Menu | **Menus → Main Menu** (sama dengan navbar) |
| Alamat | artikel **Kantor Pusat** di kategori Our offices |
| Telepon/email | kategori **Contact** (yang ada link-nya) + tombol Buka Peta |
| Baris hak cipta | artikel `footer-copyright` |

### Mengganti logo
**Content → Media** → unggah file bernama `logo.png`, timpa yang lama. Navbar dan footer
ikut berubah, tanpa deploy ulang. Tekan Ctrl+F5.

### Mengubah baris hak cipta
Sunting artikel `footer-copyright`. Tulis `{year}` di tempat tahun — otomatis diganti tahun
berjalan, jadi tidak perlu disunting lagi tiap Januari.

---

## Menu navigasi

Satu menu dipakai navbar dan footer: **Main Menu** (Beranda, Tentang Kami, Layanan, Kontak).
Jangan tambah item khusus footer — navbar ikut berubah.

### Create — menambah item menu
1. **New**
2. **Menu Item Type** → **System Links → URL**
3. **Link**: `#offices` (harus cocok dengan `id` section di halaman)
4. **Title**: teks yang tampil
5. **Language**: pilih satu bahasa (jangan `All`, nanti dobel di semua bahasa)
6. **Save**

`id` section yang tersedia: `#top`, `#why`, `#services`, `#customers`, `#coverage`, `#offices`, `#contact`.

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
