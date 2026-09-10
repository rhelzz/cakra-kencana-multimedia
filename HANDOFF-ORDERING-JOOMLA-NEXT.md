# Handoff: masalah ordering Joomla ke Next.js

## Tujuan

Client harus dapat menentukan urutan konten dari Joomla, lalu halaman Next.js menampilkan urutan yang sama secara konsisten untuk About, Our Offices, dan konten sejenis.

Urutan yang diharapkan untuk kategori **Our offices**:

1. Kantor Pusat
2. Workshop I
3. Workshop II
4. Workshop III

Jangan memakai ID, tanggal pembuatan, atau hardcode alias sebagai urutan permanen. Client menginginkan urutan yang dapat dikustomisasi dari CMS.

## Kondisi proyek

- Backend: Joomla 5.4.7 di `backend/`
- Frontend: Next.js 16.3 di `frontend/`
- API boundary: `frontend/src/lib/joomla.ts`
- Plugin revalidate: `backend/plugins/system/nextrevalidate/`
- CMS production: `https://cms.cakrakencanamultimedia.com`
- Frontend production: `https://cakrakencanamultimedia.com`
- Multilingual Joomla tidak aktif sebagai fitur UI. Tidak ada filter Language pada daftar Articles.
- Bahasa dibedakan menggunakan akhiran alias: `-id`, `-en`, dan `-zh`.

## Implementasi frontend saat ini

`getCategory()` meminta artikel dengan:

```text
list[ordering]=ordering&list[direction]=asc
```

Setelah itu `pickTranslations()`:

1. Mengelompokkan artikel berdasarkan base alias.
2. Memilih terjemahan sesuai locale.
3. Menggunakan posisi artikel Indonesia sebagai urutan utama atau **spine** untuk semua bahasa.

Komponen `About.tsx` dan `Offices.tsx` hanya menjalankan `.map()` terhadap hasil `getCategory()`. Keduanya tidak melakukan sort tambahan atau membalik array.

Footer sudah diperbaiki terpisah agar memilih alias `office-head-office`, bukan sekadar `offices[0]`.

## Gejala

- Urutan di administrator Joomla dapat terlihat benar, tetapi halaman frontend pernah tampil terbalik.
- Kadang frontend terlihat benar dan kadang dianggap tidak mengikuti perubahan terbaru.
- Joomla Cache sudah dimatikan.
- Next.js menggunakan `next: { revalidate: 60 }`.
- Tidak ada dropdown filter bahasa di daftar Articles; hanya pencarian alias yang tersedia.

## Bukti yang sudah diverifikasi

### 1. API tidak menghasilkan urutan acak

Endpoint production kategori Our offices diperiksa tiga kali dengan `ordering ASC`. Ketiga respons identik.

Urutan artikel Indonesia dalam respons saat pemeriksaan:

```text
office-workshop-iii-id
office-workshop-ii-id
office-workshop-i-id
office-head-office-id
```

Jadi respons API stabil, tetapi nilai ordering artikel Indonesia pada saat itu masih menghasilkan:

```text
Workshop III → Workshop II → Workshop I → Kantor Pusat
```

### 2. HTML production saat pemeriksaan justru benar

Posisi teks dalam HTML production adalah:

```text
Kantor Pusat → Workshop I → Workshop II → Workshop III
```

Dengan demikian, HTML production saat itu tidak sama dengan urutan artikel Indonesia yang sedang dikembalikan API. Kemungkinan yang perlu diperiksa adalah cache/data snapshot Next.js atau perbedaan artefak deployment production dengan source lokal.

### 3. Drag ordering tidak memicu event save yang didengar plugin

Joomla melakukan drag ordering melalui:

```text
articles.saveOrderAjax
→ AdminController::saveOrderAjax()
→ model->saveorder()
→ cleanCache()
→ application close
```

Jalur tersebut tidak memicu `onContentAfterSave`.

Plugin `nextrevalidate` saat ini hanya mendengarkan:

```text
onContentAfterSave
onContentAfterDelete
onContentChangeState
onExtensionAfterSave
```

Akibatnya, drag-and-drop ordering tidak memanggil webhook `/api/revalidate`. Perubahan hanya dapat terlihat setelah mekanisme cache Next.js memperbarui data, restart/deployment, atau pemicu revalidation lain.

## Root cause yang sudah terbukti

Ada dua masalah yang saling menutupi:

1. **Ordering setiap terjemahan berdiri sendiri.** Artikel `-id`, `-en`, dan `-zh` merupakan record Joomla berbeda dan masing-masing mempunyai nilai `ordering` sendiri. Frontend memakai artikel Indonesia sebagai master, sehingga nilai ordering record `-id` harus benar.
2. **Reorder AJAX tidak memicu plugin revalidate.** Plugin tidak mengetahui bahwa ordering berubah, sehingga frontend dapat menyajikan snapshot lama.

Ini bukan masalah sort di `About.tsx` atau `Offices.tsx`.

## Kendala UX CMS

Karena fitur multilingual Joomla dimatikan:

- Tidak ada filter Language pada Articles.
- Editor hanya dapat membedakan bahasa melalui alias `-id`, `-en`, dan `-zh`.
- Mencari `-id` lalu drag ordering mungkin dapat dipakai secara manual, tetapi kurang aman dan membingungkan untuk client.
- Jangan mengasumsikan filter Language tersedia kecuali multilingual Joomla memang diaktifkan dan dikonfigurasi.

## Opsi perbaikan

### Opsi A — Pertahankan ordering bawaan Joomla

Target:

- Artikel Indonesia menjadi master ordering.
- Frontend tetap menggunakan `ordering ASC` dan Indonesian spine.
- Plugin `nextrevalidate` diperluas agar perubahan dari `articles.saveOrderAjax` juga memanggil webhook.
- CMS perlu menyediakan workflow yang jelas untuk memilih hanya artikel master Indonesia meskipun filter multilingual tidak tersedia.

Catatan penting: telusuri dahulu perilaku `AdminModel::saveorder()` dan reorder condition pada `com_content`. Jangan menganggap drag pada hasil pencarian hanya memengaruhi record yang terlihat.

### Opsi B — Custom field `display-order`

Tambahkan custom field angka, misalnya:

```text
Kantor Pusat = 1
Workshop I   = 2
Workshop II  = 3
Workshop III = 4
```

Frontend mengurutkan translation set berdasarkan nilai artikel Indonesia. Ini lebih mudah dijelaskan kepada client tanpa multilingual, tetapi editor harus mengisi angka dan menangani angka duplikat.

### Opsi C — Aktifkan multilingual Joomla

Aktifkan Content Languages dan plugin Language Filter agar administrator mempunyai filter bahasa. Ini membuat workflow ordering artikel master lebih jelas, tetapi memperluas konfigurasi CMS dan harus diuji terhadap pola alias-based translation yang saat ini sengaja dipakai tanpa Joomla Associations.

## Rekomendasi awal

Jika tetap menginginkan drag-and-drop asli Joomla, pilih **Opsi A** dan perbaiki webhook reorder. Jika prioritasnya adalah workflow paling jelas bagi client tanpa mengaktifkan multilingual, pilih **Opsi B**.

Jangan mengimplementasikan keduanya sekaligus sebelum keputusan UX dibuat.

## File yang perlu diperiksa

- `CLAUDE.md`
- `frontend/AGENTS.md`
- `frontend/CLAUDE.md`
- `frontend/src/lib/joomla.ts`
- `frontend/src/components/About.tsx`
- `frontend/src/components/Offices.tsx`
- `frontend/src/components/Footer.tsx`
- `frontend/src/app/api/revalidate/route.ts`
- `backend/plugins/system/nextrevalidate/src/Extension/NextRevalidate.php`
- `backend/libraries/src/MVC/Controller/AdminController.php`
- `backend/libraries/src/MVC/Model/AdminModel.php`

## Batasan perubahan sebelumnya

- Ordering database lokal sudah dikembalikan ke keadaan awal sesuai permintaan.
- Footer production sudah dianggap selesai oleh user.
- Jangan mengembalikan hardcoded ordering berdasarkan nama/alias untuk About atau Our Offices.
- Jangan mengubah ID artikel.
- Jangan menghapus atau menimpa `joomla_db_backup.sql`; file itu untracked dan dianggap milik user.

## Verifikasi setelah perbaikan

1. Atur urutan Our offices dari Joomla.
2. Pastikan database/API artikel Indonesia menghasilkan Head Office, Workshop I, II, III.
3. Pastikan `/`, `/en`, dan `/zh` menampilkan urutan translation set yang sama.
4. Ubah ordering lagi dan pastikan webhook revalidate terpanggil.
5. Pastikan perubahan terlihat tanpa restart/deploy dan tanpa menunggu TTL 60 detik.
6. Ulangi pengujian pada About.
7. Jalankan dari `frontend/`:

```bash
npx tsc --noEmit
npm run lint
```

