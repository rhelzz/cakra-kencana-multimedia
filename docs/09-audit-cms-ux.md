# 09 — Audit: Apakah CMS-nya Ramah Editor?

Audit terhadap sisi Joomla, bukan frontend. Pertanyaannya tiga: apakah user friendly, apakah
best practice, dan apakah CRUD tiap section mudah dilakukan editor non-teknis.

**Frontend tidak disentuh dalam rencana ini kecuali di Fase 3, yang opsional dan bisa
dibatalkan.** Bagian yang sudah stabil dibiarkan stabil.

---

## Ringkasan eksekutif

| Pertanyaan | Jawaban singkat |
|---|---|
| Apakah user friendly? | **Belum.** Struktur datanya sehat, tapi editor dibiarkan menghafal aturan tak tertulis yang kalau dilanggar merusak situs tanpa peringatan. |
| Apakah best practice? | **Arsitekturnya ya, editor experience-nya tidak.** Pemisahan headless, fallback per-item, dan "semua konten dari CMS" sudah benar. Yang kurang adalah lapisan yang membuat aturan itu tidak bisa dilanggar. |
| Apakah CRUD tiap section mudah? | **Bervariasi.** Empat section mudah, tiga rawan, satu praktis butuh developer. Rinciannya di [matriks](#matriks-crud-per-section). |

Temuan terpenting: **satu salah ketik alias menghasilkan konten dobel di ketiga bahasa, tanpa
error, tanpa peringatan, dan editor tidak punya cara melihatnya dari dalam Joomla.**

Rekomendasi utama: **jangan ganti CMS, jangan tulis ulang frontend.** Nilai terbesar ada di
Fase 0 dan Fase 1 — pagar pengaman dan konfigurasi Joomla bawaan, **tanpa satu baris kode
frontend pun berubah**.

---

## Metode

1. **Simulasi terhadap logika asli.** `baseAlias()` dan `pickTranslations()` dari
   `frontend/src/lib/joomla.ts` disalin persis ke skrip terpisah, lalu diberi lima skenario
   kesalahan editor. Hasilnya dikutip apa adanya di bawah.
2. **Penelusuran codebase.** Setiap titik di mana isi Joomla mengubah perilaku frontend
   ditelusuri untuk mencari kopling yang tidak terlihat editor.
3. **Riset eksternal.** Pengalaman komunitas Joomla headless dan tolok ukur editor experience
   dari headless CMS lain. Sumber di [bagian akhir](#sumber).

---

## Temuan

### T1 — Salah ketik alias = konten dobel di semua bahasa (KRITIS)

**Bukti.** Dua artikel yang dimaksudkan sebagai terjemahan satu sama lain, tapi alias
dasarnya beda satu huruf:

```
Input : service-neon-id (id-ID) + service-neonbox-en (en-GB)

Hasil : id: [Neon box, Neon box (EN)]  ← 2 kartu
        en: [Neon box, Neon box (EN)]  ← 2 kartu
        zh: [Neon box, Neon box (EN)]  ← 2 kartu
```

**Sebab.** `baseAlias()` memotong akhiran `-id`/`-en`/`-zh` untuk mengikat satu set
terjemahan. Kalau alias dasarnya berbeda, keduanya jadi dua set berbeda. Set beranggota satu
selalu lolos ke semua bahasa (itu memang perilaku fallback yang diinginkan).

**Dampak.** Halaman Inggris menampilkan kartu berbahasa Indonesia di sebelah versi
Inggrisnya. Tidak ada error di log, tidak ada tanda di admin Joomla.

**Kenapa berbahaya.** Joomla **tidak tahu apa-apa** tentang konvensi ini. Tidak ada validasi,
tidak ada bantuan autocomplete, tidak ada kolom yang menunjukkan pasangan terjemahan. Editor
harus mengetik alias dengan benar dari ingatan, setiap kali, untuk tiga bahasa.

**Yang justru aman** (diverifikasi, di luar dugaan):

| Skenario | Hasil |
|---|---|
| Lupa akhiran bahasa (`service-neon` + `service-neon-en`) | ✅ Benar |
| Language dibiarkan `All` | ✅ Benar |
| Judul mengandung kata "ID" (`service-cetak-id-card-id`) | ✅ Benar |

Jadi masalahnya sempit tapi tajam: **hanya alias dasar yang tidak cocok**, dan itu justru
kesalahan paling manusiawi.

---

### T2 — Artikel satu bahasa bocor ke semua bahasa (TINGGI)

**Sebab.** Set terjemahan beranggota satu selalu terpilih untuk semua locale.

**Dampak.** Editor membuat layanan baru hanya dalam bahasa Indonesia. Layanan itu **langsung
muncul di halaman Inggris dan Mandarin dalam bahasa Indonesia**, tanpa penanda apa pun.

**Ini sebenarnya perilaku yang dirancang** — fallback per-item yang membuat halaman tidak
pernah bolong. Yang salah bukan logikanya, melainkan **tidak ada yang memberi tahu editor**
bahwa pekerjaannya belum selesai. Tidak ada daftar "belum diterjemahkan" di mana pun.

---

### T3 — Menghapus kategori mematikan satu section (TINGGI)

**Bukti.** `CATEGORY` di `joomla.ts` memuat ID kategori sebagai angka mati (`services: 10`).

**Dampak.** Editor yang menghapus kategori lalu membuatnya kembali dengan nama sama akan
mendapat ID baru. Section terkait langsung kosong dan **tidak bisa diperbaiki dari admin** —
harus developer yang mengubah kode.

**Kemungkinan terjadi:** kecil, tapi biayanya besar dan pemulihannya di luar jangkauan editor.
Tidak ada peringatan apa pun di Joomla.

---

### T4 — Field `icon` tanpa penjelasan, dan menambah pilihan butuh developer (SEDANG)

**Bukti.** Saat dibuat, field `icon` diberi `description: ""` — kosong. Bandingkan dengan
dua field lain yang punya penjelasan:

| Field | Deskripsi di admin |
|---|---|
| `icon` | *(kosong)* |
| `map` | "Google Maps link for this location. Leave empty to hide the button." |
| `link` | "Profile URL this icon points to." |

**Dampak.** Editor melihat dropdown 23 pilihan berlabel Inggris tanpa keterangan, tanpa
pratinjau bentuk ikonnya. Harus tebak-tebakan lalu cek di situs.

**Ditambah:** menambah pilihan ikon baru butuh dua langkah yang salah satunya di dalam kode.
Bagi editor, ini pintu tertutup — dan itu **konsekuensi sadar** dari memilih daftar terkurasi
(lihat [01 — Arsitektur](01-arsitektur.md#ikon-daftar-terkurasi-bukan-lucide-reactdynamic)),
bukan kelalaian. Tapi tetap harus dicatat sebagai batas.

---

### T5 — Tidak ada pratinjau (TINGGI untuk pengalaman editor)

Tombol **Preview** di Joomla mengarah ke frontend Joomla, yang **tidak kita render sama
sekali**. Editor yang menekannya akan melihat template Joomla kosong — bukan situsnya.

Satu-satunya cara melihat hasil: buka tab lain ke `localhost:3000`, cari section-nya, refresh.
Untuk halaman detail layanan, editor bahkan harus menebak URL-nya karena memakai ID artikel.

Ini jurang terbesar dibanding CMS headless modern. Tolok ukur industri 2026 sudah di
*live preview* berdampingan, bahkan *inspector mode* untuk melompat dari elemen ke field-nya.
Kita di titik nol.

---

### T6 — Aturan tersembunyi yang mengubah tampilan (SEDANG)

Perilaku yang tidak terlihat sama sekali dari dalam admin Joomla:

| Aturan | Akibat kalau editor tidak tahu |
|---|---|
| Kantor **pertama** muncul di footer | Menggeser urutan kantor diam-diam mengubah alamat di footer |
| Field `map` kosong → tombol Buka Peta hilang | Dikira bug |
| Field `link` kosong → ikon sosmed hilang total | Dikira artikelnya tidak tersimpan |
| Bullet list → checklist merah; paragraf → teks biasa | Bentuk berubah tanpa sebab yang jelas |
| Teks **sebelum** Read more → kartu; **sesudah** → halaman detail | Halaman detail terlihat kosong padahal artikel penuh |
| Nilai ikon tak dikenal → diam-diam jadi ikon cadangan | Editor mengira pilihannya tersimpan |

Semuanya sudah didokumentasikan di [04 — Panduan Editor](04-panduan-editor.md). Tapi
dokumentasi di luar aplikasi adalah pengganti yang lemah untuk petunjuk **di dalam** form.

---

### T7 — Admin generik, tidak disesuaikan (SEDANG)

Yang dilihat editor saat membuka Joomla:

- **±60 artikel dalam satu daftar**, tiga bahasa bercampur, termasuk `heading-services-zh`
  dan `footer-copyright` yang bukan "konten" dalam pengertian editor
- **Nama kategori berbahasa Inggris** ("Our customers", "Headings", "Services offered")
  padahal editornya berbahasa Indonesia
- **Menu admin penuh** — Banners, Newsfeeds, Smart Search, Contacts, Redirect, semuanya
  tidak dipakai tapi tetap tampil
- **Kategori "Headings"** yang isinya sembilan artikel tanpa isi, hanya judul — tidak akan
  ada editor yang menebak fungsinya tanpa diberi tahu

Joomla 5 punya **Custom Administrator Menu per grup user** sebagai fitur bawaan. Belum dipakai
sama sekali.

---

### T8 — Logika paling menentukan tidak punya satu pun pengaman (SEDANG)

`pickTranslations()` menentukan artikel mana yang tampil di bahasa mana. Seluruh situs
bergantung padanya. **Tidak ada test.** Perubahan regex satu karakter di `baseAlias()` bisa
mengacaukan ketiga bahasa dan tidak ada yang menangkapnya sebelum tayang.

Ini bukan masalah editor, tapi masuk audit karena permintaannya eksplisit: jangan sampai ada
micro-bug pada fitur yang sudah stabil. Fitur yang stabil tanpa pengaman hanya stabil sampai
ada yang menyentuhnya.

---

## Matriks CRUD per section

Skor: 🟢 mudah · 🟡 bisa tapi ada jebakan · 🔴 butuh developer

| Section | Create | Update | Delete | Terjemahkan | Hambatan utama |
|---|:--:|:--:|:--:|:--:|---|
| Hero | 🔴 | 🟢 | 🔴 | 🟡 | Singleton — tidak boleh ditambah/dihapus, tapi Joomla tidak mencegahnya |
| About | 🟢 | 🟢 | 🟢 | 🟡 | Bullet list vs paragraf mengubah bentuk tanpa penjelasan |
| Carousel | 🟢 | 🟢 | 🟢 | — | Paling mulus. Bahasa `All`, tidak ada alias konvensi |
| Services | 🟡 | 🟢 | 🟢 | 🟡 | Pilihan ikon terbatas; isi halaman detail harus di balik Read more |
| Customers | 🟡 | 🟢 | 🟢 | — | Logo blok jadi gumpalan putih; syaratnya tidak tertulis di mana pun dalam admin |
| Offices | 🟢 | 🟡 | 🟡 | 🟡 | Urutan diam-diam menentukan isi footer |
| Social | 🟢 | 🟢 | 🟢 | — | Link kosong = ikon hilang; tidak dijelaskan… (sebenarnya dijelaskan, field ini punya deskripsi) |
| Headings | 🔴 | 🟢 | 🔴 | 🟡 | Konsepnya tidak akan tertebak tanpa dokumentasi |
| Menu | 🟢 | 🟢 | 🟢 | 🟡 | Harus tahu daftar `#id` section yang valid |

**Pola yang terlihat:** yang berbahasa `All` (Carousel, Customers, Social) paling mudah —
persis karena bebas dari konvensi alias. Yang multibahasa semuanya kena 🟡 di kolom
Terjemahkan. Itu satu akar masalah, bukan tujuh.

---

## Perbandingan dengan sistem serupa

### Apa yang memang wajar hilang di Joomla headless

Joomla Community Magazine menyatakan terus terang:

> "Template overrides, module positions, menu-based routing, multilingual output, and built-in
> SEO markup are all part of Joomla's integrated rendering system. In a headless setup, none
> of this is provided automatically."

Kita memang sudah membangun ulang semuanya di Next.js. Jadi kehilangan itu **bukan cacat
implementasi kita**, melainkan harga arsitektur yang dipilih sadar.

Batasan yang juga tercatat komunitas dan kita alami sendiri: API Joomla hanya menutupi
komponen inti, dan **custom field tinggal di tabel terpisah sehingga tidak otomatis ikut di
respons artikel** — persis yang membuat kita harus memindahkan link peta ke custom field.

### Di mana posisi kita dibanding headless CMS lain

| Kemampuan | Kita (Joomla) | Strapi / Directus | Sanity / Payload / Storyblok |
|---|---|---|---|
| Struktur konten | ✅ kategori + custom field | ✅ | ✅ |
| Hak akses editor | ✅ matang (kekuatan Joomla) | ✅ | ✅ |
| Relasi terjemahan | ❌ konvensi alias manual | ✅ i18n bawaan | ✅ i18n bawaan |
| Daftar "belum diterjemahkan" | ❌ | ✅ | ✅ |
| Live preview | ❌ | 🟡 perlu konfigurasi | ✅ |
| Singleton (Hero, Footer) | ❌ dianggap artikel biasa | ✅ tipe Single Type | ✅ |
| Admin dalam bahasa editor | 🟡 bisa, belum dilakukan | ✅ | ✅ |

Perlu dicatat: Strapi dan Directus pun **bukan juara editor experience** — keduanya dinilai
lebih cocok untuk tim teknis ketimbang marketer non-teknis. Jadi bermigrasi ke sana belum
tentu menjawab keluhan yang sedang kita bahas.

Yang benar-benar unggul di sisi editor (Sanity, Storyblok, Payload) menang justru pada dua hal
yang bisa kita kejar sebagian tanpa ganti CMS: **preview** dan **panduan di dalam form**.

### Kenapa saya tidak menyarankan ganti CMS

- Migrasi berarti membangun ulang model konten, memindahkan ±60 artikel tiga bahasa, menulis
  ulang seluruh `lib/joomla.ts`, dan mengulang seluruh pengujian.
- Masalah nyata kita — konvensi alias, preview, panduan — **tiga-tiganya bisa dikurangi tanpa
  migrasi**.
- Hak akses dan alur editorial Joomla sudah matang dan gratis.
- Frontend sudah stabil. Migrasi CMS berarti membongkar satu-satunya bagian yang terbukti jalan.

Migrasi baru masuk akal kalau nanti muncul kebutuhan yang benar-benar tidak bisa ditawar,
misalnya alur persetujuan berjenjang atau puluhan editor bersamaan.

---

## Rencana bertahap

Diurutkan berdasarkan **rasio manfaat terhadap risiko**, bukan besarnya pekerjaan. Fase 0 dan
1 tidak menyentuh kode frontend sama sekali.

---

### Fase 0 — Pagar pengaman (prasyarat, bukan fitur)

**Tujuan.** Tidak menambah apa pun untuk editor. Memastikan fase berikutnya tidak bisa
merusak apa yang sudah jalan.

**Langkah.**

1. **Satu file test** untuk `baseAlias()` + `pickTranslations()`, berisi kelima skenario yang
   sudah disimulasikan di audit ini, termasuk kasus gagal T1 sebagai perilaku terdokumentasi.
   Tanpa framework — cukup `node --test`.
2. **Satu skrip pemeriksa konsistensi konten** yang memanggil API dan melaporkan:
   - set terjemahan yang anggotanya kurang dari tiga → daftar "belum diterjemahkan"
   - alias yang tidak berakhiran `-id`/`-en`/`-zh` di kategori multibahasa
   - artikel dengan `icon` yang tidak dikenal peta ikon
   - kategori yang ID-nya tidak lagi cocok dengan `CATEGORY`

**Effort.** ~2–3 jam.
**Risiko regresi.** Nol. Tidak ada kode produksi yang berubah.

| Pro | Kontra |
|---|---|
| Menangkap T1 dan T2 dalam hitungan detik, bukan setelah klien komplain | Harus dijalankan manual (belum ada CI) |
| Menjadikan perilaku fallback terdokumentasi sebagai kontrak, bukan kebetulan | Skrip pemeriksa butuh perawatan kalau model konten berubah |
| Membuat Fase 3 aman dikerjakan nanti | |

**Output yang diharapkan.** `npm test` lulus. `npm run check:content` mencetak laporan seperti:

```
✔ 9 layanan, 3 bahasa lengkap
✖ service-neon: hanya id-ID (kurang en-GB, zh-CN)
✖ service-neonbox-en: alias tidak berpasangan
```

**Sebab → akibat.** Selama ini kesalahan editor tidak terlihat sampai muncul di situs. Setelah
fase ini, kesalahan terlihat dalam satu perintah, sebelum ada yang menyadarinya.

---

### Fase 1 — Rapikan Joomla dengan fitur bawaannya (manfaat terbesar per jam kerja)

**Tujuan.** Editor membuka admin dan langsung tahu harus ke mana. Tanpa satu baris kode.

**Langkah.**

1. **Isi deskripsi semua custom field** (Content → Fields). Terutama `icon` yang masih kosong.
   Tulis dalam bahasa Indonesia, sebutkan konsekuensinya: *"Kosongkan untuk menyembunyikan
   tombol."*
2. **Ganti nama kategori ke bahasa Indonesia** — "Our customers" → "Klien", "Headings" →
   "Judul Section (jangan dihapus)". **ID kategori tidak berubah saat rename**, jadi kode aman.
3. **Buat Custom Administrator Menu** untuk grup "Editor Konten", berisi hanya:
   Hero · Tentang · Layanan · Galeri · Klien · Kantor · Sosmed · Judul Section · Menu · Media.
   Fitur bawaan Joomla 5, tanpa extension.
4. **Buat grup user "Editor Konten"** tanpa akses ke Extensions, Plugins, Global Configuration.
   Sekaligus menutup risiko T3 — editor tidak bisa menghapus kategori kalau tidak diberi izin.
5. **Isi kolom Note tiap artikel singleton** dengan peringatan singkat, mis. pada `home-hero`:
   *"Jangan dihapus. Satu per bahasa."*
6. **Tambah Field Group "Tampilan"** supaya `icon`, `map`, `link` berkumpul di satu tab yang
   jelas, bukan tercecer di tab Fields.

**Effort.** ~3–4 jam, semuanya klik di admin.
**Risiko regresi.** Sangat rendah. Satu-satunya yang perlu hati-hati: **rename kategori aman,
hapus-lalu-buat-ulang tidak.**

| Pro | Kontra |
|---|---|
| Menyelesaikan sebagian besar T4, T6, T7 tanpa kode | Petunjuk tetap pasif — editor masih bisa mengabaikannya |
| Mencegah T3 lewat izin, bukan lewat harapan | Perlu didokumentasikan ulang kalau struktur berubah |
| Reversibel sepenuhnya | Tidak menyentuh T1 sama sekali |

**Output yang diharapkan.** Editor baru bisa menambah satu layanan lengkap tanpa bertanya,
hanya berbekal apa yang tertulis di layar.

**Sebab → akibat.** Kebingungan sekarang berasal dari admin generik yang menampilkan segalanya
dan menjelaskan apa-apa. Setelah fase ini, yang tampil hanya yang relevan, dan setiap field
menjelaskan dirinya.

---

### Fase 2 — Pratinjau

**Tujuan.** Editor bisa melihat hasilnya tanpa menebak URL.

**Langkah.**

1. Perluas plugin `plg_system_nextrevalidate` yang sudah ada (jangan buat plugin baru) agar
   juga menampilkan tombol **"Lihat di situs"** pada form artikel, mengarah ke
   `{frontend}/{locale}#{section}` sesuai kategori artikelnya.
2. Untuk kategori Services, arahkan langsung ke `/services/{id}`.

**Effort.** ~3 jam.
**Risiko regresi.** Rendah tapi **tidak nol** — plugin ini berada di jalur simpan konten.
Kegagalannya harus tetap ditangkap seperti sekarang, sehingga menyimpan tidak pernah gagal.

| Pro | Kontra |
|---|---|
| Menutup T5, jurang terbesar dibanding CMS modern | Bukan live preview — tetap pindah tab |
| Memanfaatkan plugin yang sudah ada dan sudah teruji | Menambah tanggung jawab pada plugin yang sekarang tugasnya tunggal |
| Editor berhenti menebak URL halaman detail | URL frontend jadi satu lagi hal yang harus dikonfigurasi |

**Output yang diharapkan.** Dari tombol Save ke melihat hasil: satu klik, bukan buka tab lalu
mencari section.

**Alternatif yang ditolak:** live preview berdampingan lewat iframe. Butuh mode draft,
endpoint preview, dan penanganan token. Berminggu-minggu kerja untuk situs delapan section.
Tidak sepadan.

---

### Fase 3 — Hilangkan jebakan alias (opsional, satu-satunya yang menyentuh frontend)

**Tujuan.** Menyelesaikan T1 dan T2 di akarnya.

Tiga opsi, dianalisis apa adanya:

**Opsi A — Biarkan konvensi alias, andalkan pemeriksa dari Fase 0.**
Nol perubahan kode. Kesalahan tetap mungkin terjadi, tapi ketahuan sebelum tayang.

**Opsi B — Ganti dengan custom field `translation_key`.**
Editor mengetik kunci yang sama di ketiga artikel; alias bebas. Frontend mengelompokkan
berdasarkan field itu, bukan alias.
*Pro:* alias bebas mengikuti SEO tiap bahasa; kesalahan lebih kentara karena field-nya
eksplisit. *Kontra:* mengubah `pickTranslations()`; harus mengisi ulang ±40 artikel; masih
mengandalkan ketikan manusia.

**Opsi C — Pakai fitur Associations Joomla.**
Cara resmi Joomla. *Pro:* UI bawaan untuk memasangkan terjemahan, editor tinggal memilih dari
dropdown, bukan mengetik. *Kontra:* butuh plugin Language Filter aktif — fitur yang dirancang
untuk frontend Joomla yang tidak kita pakai, jadi harus diuji apakah efek sampingnya aman.
Data asosiasi juga **harus dipastikan dulu muncul di API** sebelum opsi ini layak dipilih —
mengingat riwayat `urls` yang tidak ikut di endpoint daftar, ini tidak boleh diasumsikan.

**Rekomendasi.** **Opsi A dulu.** Jalankan pemeriksa dari Fase 0 selama beberapa minggu. Kalau
laporannya selalu bersih, konvensi alias ternyata cukup dan tidak perlu diapa-apakan. Kalau
sering merah, baru selidiki Opsi C — dimulai dengan **membuktikan** asosiasi muncul di API,
sebelum menulis kode apa pun.

**Sebab → akibat.** Mengganti mekanisme terjemahan sekarang berarti menyentuh fungsi paling
menentukan di seluruh situs demi masalah yang belum terukur frekuensinya. Ukur dulu, baru
putuskan.

---

### Fase 4 — Yang sebaiknya TIDAK dikerjakan

Bagian ini sama pentingnya dengan tiga fase di atas.

| Ide | Kenapa tidak |
|---|---|
| Migrasi ke Strapi/Directus/Sanity | Membongkar satu-satunya bagian yang stabil demi masalah yang bisa diselesaikan tanpa migrasi. Strapi dan Directus pun bukan juara editor experience. |
| Live preview berdampingan | Berminggu-minggu kerja, mode draft, endpoint preview. Untuk situs delapan section, tombol "Lihat di situs" sudah 80% manfaatnya. |
| Komponen Joomla buatan sendiri untuk tiap section | Meninggalkan jalur yang aman di-update. Sekarang `joomla update` aman justru karena kita tidak menyentuh core. |
| Editor visual / drag-and-drop | Section-nya tetap. Yang berubah cuma isinya. Tidak ada yang perlu diseret. |
| Bahasa keempat | Belum ada permintaan. ±40 artikel baru. |
| Menjadikan pilihan ikon bisa ditambah dari admin | Berarti kembali ke `DynamicIcon` yang membawa 1500 ikon ke bundle — persis yang dihindari, dan dilarang dokumentasi Lucide sendiri. |

---

## Urutan yang disarankan

```
Fase 0  →  Fase 1  →  (ukur beberapa minggu)  →  Fase 2  →  Fase 3 kalau data bilang perlu
pagar      rapikan       jalankan pemeriksa       preview     hanya kalau terbukti sering salah
```

**Kalau hanya sempat satu:** Fase 1. Manfaat terbesar, risiko terkecil, tanpa kode.

**Kalau hanya sempat satu jam:** isi deskripsi field `icon` dan ganti nama kategori ke bahasa
Indonesia. Dua tindakan itu saja sudah menghapus sebagian besar kebingungan harian.

---

## Jawaban akhir atas tiga pertanyaan

**Apakah CMS-nya user friendly?** Untuk mengubah konten yang sudah ada — ya, cukup. Untuk
menambah konten baru dalam tiga bahasa — belum, karena editor menanggung aturan yang
seharusnya ditanggung sistem.

**Apakah ini best practice?** Model datanya iya: artikel Joomla biasa, tanpa tabel buatan
sendiri, tanpa core yang disentuh, `joomla update` tetap aman. Pilihan headless-nya juga sesuai
dengan yang direkomendasikan komunitas Joomla. Yang belum best practice adalah **lapisan
pengaman editor**: tidak ada validasi, tidak ada preview, tidak ada panduan di dalam form.

**Apakah CRUD tiap section mudah?** Lima dari sembilan mudah tanpa syarat. Sisanya bisa
dikerjakan tapi menyimpan jebakan, dan semua jebakan itu berpangkal pada satu hal yang sama —
konvensi alias multibahasa. Perbaiki itu (atau cukup awasi dengan pemeriksa), maka sisanya
tinggal pekerjaan rapi-rapi.

---

## Sumber

- [Using Joomla as a Headless CMS — Joomla Community Magazine](https://magazine.joomla.org/all-issues/march-2026/using-joomla-as-a-headless-cms)
- [Can Joomla Be Used as a Headless CMS?](https://wixmediagroup.com/how-to/joomla-headless-cms-guide-2025/)
- [Migrate from Joomla to Strapi 5 — catatan Strapi soal custom field Joomla di tabel terpisah](https://strapi.io/blog/how-to-migrate-from-joomla-to-strapi)
- [Custom fields in multi language website — joomla-cms issue #18396](https://github.com/joomla/joomla-cms/issues/18396)
- [Adding a Custom Administrator Menu — Joomla Documentation](https://guide.joomla.org/user-manual/menus/menus-adding-a-custom-administrator-menu)
- [J4.x: Adding a Custom Administrator Menu](https://docs.joomla.org/J4.x:Adding_a_Custom_Administrator_Menu)
- [Headless CMS Editor Experience Comparison — Webstacks](https://www.webstacks.com/blog/headless-cms-content-editor-experience-platform-comparison)
- [Strapi vs Directus 2026 — UnfoldCMS](https://unfoldcms.com/blog/strapi-vs-directus-2026)
- [Best Headless CMS with Visual Editing — Prismic](https://prismic.io/blog/best-headless-cms-with-visual-editing)
