# 06 — API Joomla

Base URL: `http://company-profile.test/backend/api/index.php/v1`

Semua request wajib membawa:

```
X-Joomla-Token: <token>
Accept: application/vnd.api+json
```

Untuk POST/PATCH tambahkan `Content-Type: application/json`.

> Header `Accept` **tidak opsional**. Tanpa itu Joomla membalas
> `Could not match accept header` — dan pesannya tidak menyebut header mana.

## Endpoint yang dipakai frontend

| Endpoint | Dipakai oleh |
|---|---|
| `GET /content/articles?page[limit]=200` | `getArticle()` |
| `GET /content/articles?filter[category]={id}&list[ordering]=ordering&list[direction]=asc&page[limit]=200` | `getCategory()` |
| `GET /menus/site/items` | `getMenu()` |
| `GET /config/application?page[limit]=100` | `getSiteName()` |

Cuma empat. Semua section dibangun dari itu.

## Contoh

### Ambil satu kategori, terurut

```bash
curl -s \
  -H "X-Joomla-Token: $TOKEN" \
  -H "Accept: application/vnd.api+json" \
  "$API/content/articles?filter[category]=10&list[ordering]=ordering&list[direction]=asc&page[limit]=200"
```

### Membuat artikel dengan custom field

```bash
curl -s -X POST "$API/content/articles" \
  -H "X-Joomla-Token: $TOKEN" \
  -H "Accept: application/vnd.api+json" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Neon box",
    "alias": "service-neon-box-id",
    "catid": 10,
    "language": "id-ID",
    "state": 1,
    "access": 1,
    "ordering": 10,
    "introtext": "<p>Papan nama bercahaya untuk toko dan kantor.</p>",
    "com_fields": { "icon": "frame" }
  }'
```

Perhatikan asimetrinya: **menulis** custom field lewat `com_fields`, **membaca**-nya di level
atas dengan nama field.

### Mengubah gambar artikel

```bash
curl -s -X PATCH "$API/content/articles/1" \
  -H "X-Joomla-Token: $TOKEN" \
  -H "Accept: application/vnd.api+json" \
  -H "Content-Type: application/json" \
  -d '{"images":{"image_fulltext":"images/hero.jpg","image_fulltext_alt":"Latar hero"}}'
```

Saat **menulis**, path harus relatif (`images/hero.jpg`). Saat **membaca**, Joomla
mengembalikannya sebagai URL absolut lengkap dengan penanda `#joomlaImage://…`.

---

## Kejanggalan API yang ditemukan (dan cara mengatasinya)

Semua di bawah ini ditemukan lewat percobaan langsung selama pengerjaan, bukan dari dokumentasi.

### 1. Custom field muncul di level atas, bukan di bawah `com_fields`

```json
{
  "title": "Digital printing solutions",
  "icon": { "printer": "Digital printing" },
  "map": ""
}
```

Field bertipe **List** datang sebagai objek `{value: label}`, bukan string. Field bertipe
**URL/Text** datang sebagai string biasa. Fungsi `fieldValue()` menangani keduanya.

### 2. `urls` tidak ada di endpoint daftar

`urls` (Link A/B/C) hanya dikembalikan endpoint **artikel tunggal**. Ini yang memaksa link
peta pindah ke custom field. Lihat [05 — Kustomisasi](05-kustomisasi-joomla.md#kenapa-map-tidak-memakai-link-a-bawaan-joomla).

### 3. `catid` dan `ordering` tidak ada di respons artikel sama sekali

Baik endpoint daftar maupun tunggal tidak mengembalikannya. Akibatnya:

- tidak bisa tahu satu artikel ada di kategori mana lewat API
- halaman detail layanan mencari artikelnya **di dalam daftar kategori**, bukan lewat
  `GET /content/articles/{id}` — sekalian jadi pemeriksaan 404-nya
- skrip seeding harus menyimpan sendiri peta alias → catid

### 4. Halaman default 20 item

**Kejanggalan paling berbahaya di daftar ini.** Tanpa `page[limit]`, API hanya mengembalikan
20 artikel — tanpa error, tanpa peringatan.

Ini pernah membuat **hero hilang dari situs** begitu jumlah artikel melewati 20: `getArticle()`
memindai halaman pertama, `home-hero` terdorong ke halaman dua, fungsi mengembalikan `null`,
komponen merender kosong. Semua panggilan daftar sekarang membawa `page[limit]=200`.

### 5. Alias unik per kategori, bahasa bukan bagian dari kunci

```json
{"errors":[{"title":"Save failed with the following error: Another Article in this category has the same alias.","code":400}]}
```

Inilah sebabnya ada konvensi akhiran `-id` / `-en` / `-zh`.

### 6. `PATCH /menus/site/items/{id}` selalu 500

Membuat item menu (POST) berhasil; mengubahnya selalu gagal dengan Internal Server Error.
Konsekuensinya: item menu harus disunting lewat admin UI, atau lewat SQL langsung.

### 7. `urls.targeta` menolak `_blank`

```json
{"errors":[{"title":"Invalid field: URL Target Window"}]}
```

Joomla mengharapkan kode numerik, bukan nama target HTML.

### 8. Beberapa kolom wajib diisi walau kosong

- Membuat **field**: `description` dan `default_value` wajib ada, kalau tidak
  `Field 'description' doesn't have a default value`
- `INSERT` manual ke `n213k_extensions`: kolom `custom_data` wajib ada

### 9. URL media membawa penanda internal

```
http://…/images/hero.jpg#joomlaImage://local-images/hero.jpg?width=400&height=400
```

Bagian setelah `#` adalah metadata internal Joomla. Browser membuangnya, jadi `<img>` biasa
tetap jalan — tapi `next/image` akan menolak URL itu. `cleanImage()` memotongnya.

### 10. Entity HTML dari TinyMCE

Editor menyimpan `&amp;`, `&copy;`, dan kawan-kawan. Kalau string itu dirender React sebagai
teks, React meng-escape ulang tanda `&`-nya, sehingga pengunjung melihat `&amp;` mentah.
`stripTags()` men-decode 22 entity yang benar-benar dikeluarkan TinyMCE.

Bug ini muncul dua kali: pertama pada `&amp;` di daftar "Why choose us", lalu pada `&copy;`
di baris hak cipta.

### 11. `DELETE` diam-diam gagal untuk artikel yang masih Published

`DELETE /content/articles/{id}` membalas **HTTP 204 (sukses)** tetapi artikelnya tetap ada.
Joomla mensyaratkan artikel berada di Trash lebih dulu:

```bash
curl -X PATCH .../content/articles/80 -d '{"state":-2}'   # Trash
curl -X DELETE .../content/articles/80                     # baru benar-benar terhapus
```

Artinya skrip yang mengandalkan status 204 sebagai bukti terhapus akan salah. Di situs
sendiri tidak berpengaruh — artikel yang di-Trash langsung hilang dari halaman, karena
endpoint daftar hanya mengembalikan yang Published.

### 12. Nilai custom field aman kalau tidak dikenal

Bukan bug, tapi penting: nilai `icon` yang tidak ada di peta kode **tidak** membuat halaman
error — jatuh ke ikon fallback. Ini disengaja, supaya editor yang mengetik salah tidak
merobohkan halaman.

---

## Endpoint yang tersedia tapi belum dipakai

Kalau nanti butuh:

| Endpoint | Kegunaan |
|---|---|
| `GET /content/categories` | daftar kategori |
| `GET /fields/content/articles` | definisi custom field (bukan nilainya) |
| `GET /languages/content` | daftar content language |
| `GET /media/files` | isi Media Manager |
| `GET /users` | daftar user |

## Batasan kinerja yang diketahui

`getArticle()` menarik hingga 200 artikel lalu menyaring di JavaScript, karena API tidak punya
filter alias. Dengan ~60 artikel dan cache ISR 60 detik, biayanya tidak terasa. Kalau jumlah
artikel bertambah satu kali lipat besaran, ini yang pertama perlu diperbaiki — ditandai
komentar `ponytail:` di `joomla.ts`.
