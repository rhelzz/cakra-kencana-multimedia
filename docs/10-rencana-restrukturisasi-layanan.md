# 10 — Rencana Restrukturisasi Layanan (Service → Detail → Sub-service)

Status: **Selesai (Tahap 1–6).** Diverifikasi lewat `npx tsc --noEmit`, `npm run lint`, dan
`npm run dev` manual (homepage, `/services`, `/services/[id]` dicek langsung, 3 route balas 200
dan render data yang benar). Ditulis dari
diskusi dengan klien + referensi desain FAASRI (layout saja, bukan kontennya) + dokumen daftar
layanan resmi (poster biru).

> **Hasil Tahap 1 dan kejanggalan API yang ditemukan ada di §8 — baca itu dulu kalau kamu**
> **lanjut ke Tahap 2, angka ID di §4/§6 sudah final di sana, bukan rencana lagi.**

## 1. Kenapa berubah

Struktur sekarang (lihat [03 — Model Konten](03-model-konten.md)) cuma 2 level dan flat:

```
Beranda (section Services, render semua 9 artikel)
  └── /services/[id]   (detail: judul + ikon + body + layanan lain)
```

Layanan asli perusahaan berjenjang: satu layanan besar (mis. **Digital Printing**) sebenarnya
adalah payung untuk belasan produk konkret (Banner, X-Banner, Roll Up Banner, Sticker Cutting,
dst — lihat poster). Struktur flat sekarang tidak punya tempat untuk level itu.

## 2. Struktur yang disepakati

```
Beranda → section Services
  · tampil maks. 6 kartu
  · jika total service > 6 → tombol "Lebih banyak" → /services

/services                         (index/listing — HALAMAN BARU)
  · semua service, tanpa limit

/services/[id]                    (detail — SUDAH ADA, isinya berubah)
  · hero: gambar + judul + deskripsi
  · grid masonry sub-service: tiap kartu = gambar + judul + deskripsi pendek
  · sub-service TIDAK exit ke halaman lain (2 level saja, bukan 3)
```

Referensi FAASRI dipakai **hanya untuk layout** (blok deskripsi di atas, grid kartu di bawah).
Konten sub-service yang benar adalah isi poster biru.

## 3. Konten: 9 layanan lama diganti total

Daftar final dari poster (10 layanan payung, masing-masing dengan daftar sub-service):

| # | Layanan (judul detail) | Sub-service (tiap item = 1 kartu di grid masonry) |
|---|---|---|
| 1 | Indoor / Outdoor Reklame | Billboard, Baliho, Neon Box, Neon Sign, Letter Box, Signboard, Shopsign, Totem/Pylon, A-Board, Thinplate, Huruf Timbul, Running Text, Videotron, Videowall, Umbul-umbul, Banner, Wall Banner, Car Branding, Painting, Alternative Branding |
| 2 | Tax, Permit, IMB & PBG Service | (deskripsi paragraf saja — poster tidak memecahnya jadi item; lihat §3.1) |
| 3 | Digital Printing | Banner, Vertical Banner, X Banner, Roll Up Banner, Tripod Banner, Visual Backdrop, Shelf Talker, Hanging Banner, Flying Banner, Balon Udara, Backlight Fabric, Hoarding, Mini X Banner, Event Desk, Tenda Promosi, Tenda Sarnafil, Backwall Portable, Tenda Café, Portable Booth, Bendera, Floor Sticker, Sticker Ritrama, Sticker One Way, Sticker Print & Cut, Cutting Sticker, Sunblast Sticker |
| 4 | Screen Printing | Umbul-umbul, Spanduk, Shopblind, Mini Thinplate, Plastik Packaging, Kantong Plastik, Kemasan Produk, Tali ID, T-Shirt, Goodie Bag |
| 5 | Offset Printing | Label, Brosur, Flyer, Leaflet, Kartu Nama, ID Card, Company Profile, Map, Amplop, Catalog Produk, Flag Chain, Buku Tahunan, Poster, Kalender Dinding, Kalender Meja, Tali ID Card, Karton Kemasan, Paper Bag, Tent Card, Undangan, Buku Yasin, Agenda, Nota, Surat Jalan, Surat Tanda Terima, Tas Spinbond |
| 6 | POP Merchandise | Wobler, Tumbler, Pin Button, Plakat, Tropy, Souvenir, Priceboard, Gantungan Kunci, Frame Poster, Stopper, Hard Cover Undangan dan Buku, Box Hantaran Nikah |
| 7 | POP Display | Booth Display, Portable Booth, Giant Booth, Booth Container, Rak Display, Counter Display, Standing Display, Tester Display, Dress Up Rak Display |
| 8 | Design Graphics | Design 2D (Logo, Company Profile, Banner, Flyer, T-shirt, dll), Design 3D (Design & Layout Interior, Outlet, Booth, Office, Rangka Billboard, Neon Box, Totem, Pylon, dll) |
| 9 | Rambu-Rambu | Mall, Apartment, Jalan Raya, Office, Pabrik, Fasilitas Umum |
| 10 | General Contractor | Café, Restaurant, Outlet, Store, Hotel, Apartment, Office, Warehouse, Konstruksi Baja (Gudang, Pabrik, Store), Konstruksi Billboard, Konstruksi ACP, Rak Gudang, Lemari Besi, Tralis, Kanopi, Pagar, Railing, Fasade

**Total sub-service ≈ 130 item.** Ini realistis untuk model masonry-grid (banyak kartu kecil,
tinggi bervariasi) — beda dengan tampilan FAASRI yang cuma 6 kartu per layanan.

### 3.1 Item non-list (Tax, Permit, IMB & PBG Service)

Poster tidak memecah baris ini jadi sub-item, cuma paragraf deskripsi. Untuk konsistensi
struktur data, buat **1 sub-service tunggal** memakai teks paragraf itu sebagai deskripsinya,
supaya halaman detail-nya tetap render grid (bukan cabang kode khusus untuk "layanan tanpa
sub-service"). Ini pilihan paling malas yang tetap benar — tidak perlu logika kondisional baru
di komponen React untuk kasus kosong.

### 3.2 Placeholder gambar

Disepakati: **placeholder dulu**, aset asli menyusul dari klien. Baik untuk gambar hero
10 layanan maupun ±130 gambar sub-service. Rencana teknis di §5.

## 4. Model data Joomla (best practice yang dipilih)

Dua opsi dipertimbangkan untuk relasi sub-service → induk:

- **Sub-kategori per layanan** (10 kategori baru) — ditolak: ID kategori di-hardcode di kode
  (lihat aturan di [03](03-model-konten.md)), 10 kategori baru untuk struktur yang mungkin
  masih berubah saat demo klien terlalu kaku, dan menambah beban admin (avoid kalau bisa).
- **Satu kategori baru "Layanan — Sub" + custom field `parent_service` (List)** — **dipilih**.
  Konsisten dengan pola yang sudah ada di project ini (field `icon` juga List terkurasi, lihat
  [03 — Custom Fields](03-model-konten.md#custom-fields)). Satu kategori flat, difilter di kode
  seperti `icon`/`map`/`link` sudah difilter — tidak ada konsep baru untuk dipelajari.

Rencana konkret:

| Yang dibuat | Detail |
|---|---|
| Kategori 10 "Services" | **isi diganti**: 9 artikel lama dihapus/di-unpublish, 10 artikel baru sesuai §3. Tiap artikel dapat `image_intro`/`image_fulltext` (placeholder) untuk hero detail — field ini sudah dipakai di Hero (`home-hero`), tinggal dipakai juga di sini. Field `icon` yang sudah ada tetap dipakai untuk kartu di homepage/listing. |
| Kategori baru, mis. **"Service Sub-items"** | ±130 artikel, satu per sub-service. Judul = nama sub-service (mis. "Roll Up Banner"). Isi (`introtext`) = deskripsi pendek (boleh placeholder text kalau poster tidak menjelaskan). `image_intro` = gambar placeholder. |
| Custom field baru **`parent_service`**, tipe **List** | Dipasang di kategori sub-service saja. 10 opsi, value = alias dasar tiap layanan induk (mis. `service-digital-printing`), label = judulnya. Sama persis pola `icon` yang sudah didokumentasikan di §"Menambah pilihan baru butuh dua langkah" — jadi tidak ada konsep field baru untuk dipelajari, cuma field ke-4. |

Alias & bahasa: sub-service artikel language `*` (seperti Gallery/Customers) — deskripsi
placeholder tidak butuh terjemahan sampai konten final. Kalau nanti sub-service butuh teks
per bahasa, pola `-id/-en/-zh` yang sudah ada tinggal dipakai ulang.

## 5. Rencana perubahan kode (Next.js) — belum dieksekusi

| File | Perubahan |
|---|---|
| `frontend/src/lib/joomla.ts` | Tambah `CATEGORY.serviceSubItems = 15`. Tambah helper `getSubServices(parentAlias, locale)` yang fetch kategori 15 lalu filter `fieldValue(item.attributes['parent-service']) === parentAlias`. **Perhatikan tanda hubung**: field-nya bernama `parent-service`, bukan `parent_service` — Joomla mengubahnya otomatis saat field dibuat (lihat §8). `Article['attributes']` di `joomla.ts` perlu properti baru `'parent-service'?: Record<string, string> \| string`. |
| `frontend/src/lib/i18n.ts` | Tambah label `UI.moreServices` ("Lebih banyak" / "More services" / "更多服务") — 3 bahasa wajib (TypeScript menolak build kalau kurang, sudah jadi kebiasaan project ini). |
| `frontend/src/components/Services.tsx` | `services.slice(0, 6)`; kalau `services.length > 6`, render tombol "Lebih banyak" → `${base}/services`. Kartu tidak berubah (tetap ikon + judul + deskripsi + "Selengkapnya"). |
| `frontend/src/app/[locale]/services/page.tsx` **(baru)** | Reuse markup kartu dari `Services.tsx` (ekstrak ke komponen kecil bersama kalau duplikasinya lebih dari sekali copy-paste — ponytail: cek dulu apa cukup satu file dengan prop `limit?: number` dipakai di dua tempat, sebelum bikin file terpisah). |
| `frontend/src/app/[locale]/services/[id]/page.tsx` | Tambah blok gambar besar (hero) di atas (dari `image_fulltext`/`image_intro` artikel service). Di bawah body, render grid sub-service: `getSubServices(baseAlias(article), locale)`, masonry pakai CSS `columns-2 md:columns-3` + `break-inside-avoid` (native CSS, tanpa library JS masonry — sesuai §4 di CLAUDE.md soal `<img>` polos dan menghindari dependency baru untuk yang bisa native). |

Tidak ada perubahan pada `proxy.ts`, caching, atau plugin revalidate — pola `revalidatePath('/',
'layout')` yang sudah ada otomatis mencakup route baru ini juga.

## 6. Urutan eksekusi bertahap (usulan)

1. **Joomla dulu, kosong dari kode:** buat field `parent_service`, kategori sub-service, isi
   10 layanan + ±130 sub-service (boleh isi bertahap per layanan, tidak harus 130 sekaligus)
   dengan gambar placeholder. Bisa diverifikasi lewat API sebelum kode Next.js disentuh.
2. **`lib/joomla.ts` + `i18n.ts`** — helper baru dan label baru, tanpa mengubah komponen yang
   sudah ada (aman, tidak mengubah tampilan apa pun sampai tahap ini).
3. **`Services.tsx`** — batasi 6 + tombol "Lebih banyak". Cek homepage tidak rusak.
4. **`/services/page.tsx`** — halaman listing baru.
5. **`/services/[id]/page.tsx`** — hero image + grid masonry sub-service.
6. `npx tsc --noEmit` + `npm run lint`, lalu cek manual 3 bahasa di browser (lihat aturan UI di
   [07 — Frontend](07-frontend.md)) sebelum dianggap selesai.

Setiap tahap bisa dihentikan dan di-demo terpisah — tidak ada tahap yang saling mem-block
selain urutan di atas (Joomla harus lebih dulu ada datanya sebelum kode membacanya).

## 7. Keputusan yang diambil saat eksekusi tahap 1

- 9 artikel layanan lama **di-unpublish** (`state=0`), bukan di-trash — bisa dipulihkan lewat
  admin kalau klien berubah pikiran soal daftar layanan final. 27 baris (9 × 3 bahasa) semua
  kena, id 9–17, 42–59.
- Placeholder gambar: **hero 10 layanan** dirotasi dari 4 foto yang sudah ada di
  `backend/images/gallery/*.jpg` (color-proofing, offset-press, paper-stock, screen-printing —
  ini sudah dipakai Gallery carousel, jadi tidak menambah aset baru). **145 sub-service**
  dirotasi dari 2 foto di `backend/images/banners/` (shop-ad.jpg, shop-ad-books.jpg). Ganti ke
  foto asli begitu klien menyediakannya — cukup `PATCH images.image_intro` per artikel.
- Sub-service ditulis **language `*`** (bukan per-bahasa) untuk sekarang — deskripsinya cuma
  placeholder, belum ada yang perlu diterjemahkan. Kalau kontennya sudah final dan perlu
  3 bahasa, tinggal duplikasi per alias dengan akhiran `-id/-en/-zh` seperti konvensi yang
  sudah ada (lihat [03 — Model Konten](03-model-konten.md#konvensi-alias)).

## 8. Hasil Tahap 1 (Joomla) — dieksekusi, ini datanya

| Yang dibuat | ID final | Catatan |
|---|---|---|
| Kategori **Service sub-items** | **15** | `parent_id=1`, `language=*`. Tambahkan ke tabel kategori di [03 — Model Konten](03-model-konten.md). |
| Custom field **`parent_service`** | **field id 4** | ⚠️ Joomla menyimpan `name`-nya sebagai **`parent-service`** (strip underscore → hyphen), bukan `parent_service` seperti yang di-request. **Kode Next.js harus membaca `attributes['parent-service']`, bukan `attributes.parent_service`.** Assigned ke kategori 15 saja (lihat kejanggalan #2 di bawah soal cara assign-nya). |
| 10 artikel layanan baru | id 81–215 (tersebar, lihat `frontend`-side jangan pakai id, pakai alias) | Kategori 10, `language=id-ID`, alias `service-<slug>-id`. Field `icon` terisi (dipetakan dari 23 opsi curated yang sudah ada — semua 10 layanan baru cocok tanpa perlu menambah opsi baru di `lib/icons.ts`). |
| 145 artikel sub-service | kategori 15 | alias `subservice-<slug-layanan>-<nama>`, `language=*`, field `parent-service` terisi nilai alias dasar layanan induknya (mis. `service-digital-printing`). |

Pemetaan final `slug → icon`, dipakai apa adanya (tidak perlu field baru di `icons.ts`):

| Layanan | `icon` |
|---|---|
| Indoor / Outdoor Reklame | `frame` |
| Tax, Permit, IMB & PBG Service | `receipt` |
| Digital Printing | `printer` |
| Screen Printing | `shirt` |
| Offset Printing | `layers` |
| POP Merchandise | `package` |
| POP Display | `store` |
| Design Graphics | `pen-tool` |
| Rambu-Rambu | `signpost` |
| General Contractor | `hard-hat` |

### Kejanggalan API baru yang ditemukan (belum ada di [06 — API Joomla](06-api-joomla.md))

Ini semua ditemukan langsung saat eksekusi tahap 1, hari ini. Perlu ditambahkan ke
`06-api-joomla.md` juga (belum dilakukan — tandai TODO):

1. **`POST /content/categories` dan `POST /fields/{context}` membalas HTTP 500 padahal sukses.**
   Sama seperti kejanggalan `DELETE` yang sudah didokumentasikan (#11 di 06), tapi kebalikannya:
   di sini **500 tidak berarti gagal**. Selalu verifikasi lewat `GET` atau langsung ke database,
   jangan percaya status code mentah untuk endpoint-endpoint ini.

2. **`assigned_cat_ids` di body `POST /fields/{context}` tidak berpengaruh.** Field tetap
   tersimpan tapi tidak terpasang ke kategori manapun. Assignment aslinya ada di tabel terpisah
   `#__fields_categories` (`field_id`, `category_id`) dan API tidak menulis ke situ. Solusi yang
   dipakai: `INSERT` manual ke tabel itu lewat SQL.

3. **Artikel baru lewat `POST /content/articles` tidak dapat baris di `#__workflow_associations`,**
   sehingga **tidak pernah muncul di endpoint `GET /content/articles` manapun** — bukan soal
   `filter[state]`, artikelnya betul-betul tidak ikut ter-JOIN. Ini regresi dari fitur Workflow
   Joomla 4/5: artikel yang dibuat lewat UI admin otomatis dapat baris ini, API tidak. Perlu
   tambahan manual per-artikel:
   ```sql
   INSERT INTO n213k_workflow_associations (item_id, stage_id, extension)
   SELECT c.id, 1, 'com_content.article' FROM n213k_content c
   LEFT JOIN n213k_workflow_associations wa ON wa.item_id=c.id AND wa.extension='com_content.article'
   WHERE wa.item_id IS NULL AND c.catid IN (10, 15);
   ```
   **Kalau menambah artikel baru lewat API lagi nanti (bukan lewat admin UI), jalankan ulang**
   **query ini** atau artikel itu akan tersimpan tapi tidak pernah tayang di frontend.

4. **`com_fields` di body POST/PATCH sudah berhenti berfungsi di lingkungan ini** — baik untuk
   field lama (`icon`, sudah terbukti jalan waktu seeding awal 2026-08-09) maupun field baru
   (`parent_service`). Diverifikasi dengan mengulang persis contoh yang ada di
   [06 — API Joomla](06-api-joomla.md#membuat-artikel-dengan-custom-field): artikel tersimpan,
   tapi baris di `#__fields_values` tidak pernah dibuat. Penyebabnya belum ditemukan (bukan
   soal request — request-nya identik dengan yang dulu berhasil). **Solusi yang dipakai:**
   isi `#__fields_values` langsung lewat SQL setelah artikel dibuat:
   ```sql
   INSERT INTO n213k_fields_values (field_id, item_id, value) VALUES (<field_id>, <item_id>, '<value>');
   ```
   **Kalau menambah artikel baru dengan custom field lewat API (bukan admin UI), custom**
   **field-nya tidak akan otomatis terisi — cek `#__fields_values` setelahnya, jangan asumsikan**
   **`com_fields` di body request bekerja.**
