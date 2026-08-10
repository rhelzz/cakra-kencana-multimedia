# 03 — Model Konten

Semua konten adalah **artikel Joomla biasa**, dikelompokkan dengan **kategori**, ditambah tiga
**custom field**. Tidak ada tabel buatan sendiri, tidak ada komponen buatan sendiri.

## Kategori

ID di bawah **dipakai langsung di dalam kode** (`CATEGORY` di `frontend/src/lib/joomla.ts`).
Jangan menghapus lalu membuat ulang kategori — ID-nya akan berubah dan section jadi kosong.

| ID | Kategori | Isi | Dirender oleh |
|---|---|---|---|
| 2 | Uncategorised | `home-hero`, `footer-copyright` | Hero, Footer |
| 8 | Gallery | 4 slide carousel (gambar saja) | Gallery |
| 9 | About | 3 blok teks | About |
| 10 | Services | 9 layanan | Services + halaman detail |
| 11 | Our customers | 6 logo klien | Customers |
| 12 | Our offices | 4 lokasi | Offices + Footer |
| 13 | Social | 5 akun sosmed | SocialLinks |
| 14 | Headings | judul section per bahasa | `getHeading()` |

Kategori itu sendiri berbahasa `*` (All) — hanya wadah. Yang ditandai bahasa adalah artikelnya.

## Custom Fields

**Content → Fields** di admin.

| ID | Nama | Tipe | Dipasang di kategori | Fungsi |
|---|---|---|---|---|
| 1 | `icon` | List | Services (10), Offices (12), Social (13) | 23 pilihan ikon |
| 2 | `map` | URL | Offices (12) | Link Google Maps; **kosong = tombol hilang** |
| 3 | `link` | URL | Social (13) | URL profil; **kosong = ikon hilang** |

### Pilihan field `icon`

Nilainya harus persis sama dengan kunci di `frontend/src/lib/icons.ts` (untuk lucide) atau
`BRAND_PATHS` di `frontend/src/lib/social.ts` (untuk brand).

| Value | Label di admin | Sumber |
|---|---|---|
| `frame` | Signage / promo board | lucide |
| `receipt` | Tax & permit | lucide |
| `printer` | Digital printing | lucide |
| `layers` | Offset printing | lucide |
| `shirt` | Screen printing | lucide |
| `package` | Merchandise | lucide |
| `pen-tool` | Graphic design | lucide |
| `signpost` | Road signs | lucide |
| `hard-hat` | General contractor | lucide |
| `megaphone` | Advertising | lucide |
| `palette` | Branding / color | lucide |
| `ruler` | Interior design | lucide |
| `store` | Retail / POP | lucide |
| `truck` | Delivery / installation | lucide |
| `building` | Office / building | lucide |
| `warehouse` | Workshop / warehouse | lucide |
| `facebook` | Facebook | simple-icons |
| `instagram` | Instagram | simple-icons |
| `youtube` | YouTube | simple-icons |
| `tiktok` | TikTok | simple-icons |
| `whatsapp` | WhatsApp | simple-icons |
| `x` | X (Twitter) | simple-icons |
| `website` | Website / other | *fallback globe* |

Nilai yang tidak dikenal **tidak membuat error** — jatuh ke ikon fallback (`Frame` untuk
lucide, globe untuk brand).

Menambah pilihan baru butuh **dua langkah**, dan keduanya wajib:
1. `import` ikonnya di `frontend/src/lib/icons.ts` lalu tambahkan barisnya di `ICONS`
2. Tambahkan opsi dengan *value* yang sama di **Content → Fields → Icon**

## Cara isi artikel dipetakan ke tampilan

`bodyOf()` mengambil field pertama yang terisi: `introtext` → `text` → `articletext`.
Praktisnya: **tulis di kotak editor utama, sebelum "Read more".**

| Section | Judul artikel jadi | Isi artikel jadi | Gambar diambil dari |
|---|---|---|---|
| Hero | `<h1>` | subjudul | `image_fulltext` |
| About | `<h2>` tiap blok | paragraf **atau** checklist | — |
| Services | judul kartu & halaman detail | deskripsi singkat | — |
| Customers | `alt` logo | *(tidak dipakai)* | `image_intro` |
| Offices | nama lokasi | alamat | — |
| Gallery | *(cadangan alt)* | *(tidak dipakai)* | `image_intro` |
| Social | `aria-label` & tooltip | *(tidak dipakai)* | — |
| Headings | teks heading | *(tidak dipakai)* | — |

### Blok About: daftar vs paragraf

Kalau isi artikel berupa **bullet list**, section About merendernya sebagai checklist dengan
ikon centang merah. Kalau bukan, dirender sebagai paragraf biasa. Ini otomatis — logikanya
`listItems()` di `joomla.ts`. Jadi kamu bisa menambah blok keempat tanpa menyentuh kode.

### Token `{year}`

Artikel `footer-copyright` boleh memuat `{year}`; frontend menggantinya dengan tahun berjalan.
Supaya baris hak cipta tidak perlu disunting tiap Januari.

## Multibahasa

Bahasa utama **Indonesia**, tanpa prefix URL.

```
/       → id-ID
/en     → en-GB
/zh     → zh-CN
/id     → 308 redirect ke /
/fr     → 404
```

### Konvensi alias

Joomla **menolak alias yang sama dua kali dalam satu kategori, tanpa peduli bahasanya.**
Karena itu setiap artikel memakai akhiran bahasa:

```
service-road-signs-id     ← Indonesia (jadi acuan urutan)
service-road-signs-en
service-road-signs-zh
```

Alias tanpa akhiran itulah yang mengikat satu set terjemahan. Fungsinya `baseAlias()`.

> **Kalau kamu membuat artikel terjemahan baru, aliasnya wajib sama persis dengan versi
> Indonesianya, hanya beda akhiran.** Salah satu huruf saja, artikel itu dianggap konten
> berbeda dan akan muncul dobel.

### Urutan prioritas fallback

`pickTranslations()` memilih per artikel:

1. bahasa yang diminta
2. `*` (tanpa bahasa — dipakai bersama semua locale)
3. Indonesia
4. **tidak ditampilkan**

Sengaja **tidak ada** tingkat "bahasa apa pun yang tersisa". Menampilkan Mandarin kepada
pengunjung Indonesia itu kebocoran, bukan cadangan. Konsekuensi praktisnya: meng-*unpublish*
artikel Indonesia membuat item itu hilang dari `/`, sementara versi Inggris dan Mandarinnya
tetap tayang di `/en` dan `/zh`.

Efeknya: terjemahan Mandarin yang belum ada hanya membuat **blok itu** tampil Indonesia.
Halaman tetap utuh.

### Artikel tanpa bahasa (`*`)

Kategori **Gallery**, **Customers**, dan **Social** sengaja berbahasa `*` karena isinya tidak
punya teks yang perlu diterjemahkan (logo, foto, URL profil). Konsekuensinya: `alt` gambar
carousel hanya bahasa Indonesia. Ini trade-off yang diambil sadar — memecahnya per bahasa
berarti 12 artikel untuk 4 gambar.

### Menu

Item menu juga ditandai bahasa (**Menus → Main Menu**). `getMenu(locale)` mengambil item yang
bahasanya cocok **atau** `*`.

| Bahasa | Item |
|---|---|
| en-GB | Home, About Us, Services, Our customers |
| id-ID | Beranda, Tentang Kami, Layanan, Klien Kami |
| zh-CN | 首页, 关于我们, 服务, 合作客户 |

Item bertipe **URL** dengan isi `#about`, `#services`, `#customers`, `#top`. Item "Home"
versi Inggris masih bertipe *component* — dipetakan ke `#top` di dalam kode karena
**PATCH menu item lewat API selalu balas 500** (lihat [06 — API Joomla](06-api-joomla.md)).

## Peta artikel saat seeding

Untuk orientasi saja. **Jangan mengandalkan ID artikel di kode** — pakai alias.

| Alias dasar | Kategori | Catatan |
|---|---|---|
| `home-hero` | 2 | judul + subjudul + gambar hero |
| `footer-copyright` | 2 | mendukung `{year}` |
| `gallery-1` … `gallery-4` | 8 | bahasa `*` |
| `about-who-we-are` | 9 | paragraf |
| `about-service-area` | 9 | paragraf |
| `about-why-choose-us` | 9 | bullet list → checklist |
| `service-*` (9 buah) | 10 | punya field `icon` |
| `customer-*` (6 buah) | 11 | bahasa `*` |
| `office-head-office`, `office-workshop-i…iii` | 12 | punya `icon` + `map` |
| `social-*` (5 buah) | 13 | bahasa `*`, punya `icon` + `link` |
| `heading-services`, `heading-customers`, `heading-offices` | 14 | 3 bahasa masing-masing |
