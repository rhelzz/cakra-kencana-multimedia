# Patch Note — Hapus Bagian Compro (Contact)

Tanggal: 2026-10-01
Pelaksana: agent (atas izin owner, sesi revisi)

## Yang diubah

Bagian **Compro** (kartu "Request Compro" / unduh company profile via Google Drive)
di section Contact dihapus total:

- 3 artikel dihapus dari Joomla (kategori Contact, `catid=16`):
  - `702` — `Request Compro` (`request-compro-id`, id-ID)
  - `703` — `Request Company Profile` (`request-compro-en`, en-GB)
  - `704` — `request-compro-zh` (zh-CN)
- Tidak ada kategori khusus Compro — yang ada hanya kategori `16 Contact`,
  jadi kategori tidak dihapus. Kategori Contact tersisa 12 artikel
  (Marketing I/II/III, Email × 3 bahasa).
- Relasi ikut terbersihkan otomatis oleh Joomla: 3 baris `assets`
  (`com_content.article.70x`), 3 `workflow_associations`, 3 `fields_values`
  (field `link` URL Drive). Total artikel `458 → 455`.

## Cara hapus (via API, bukan SQL langsung)

Supaya relasi + revalidate ikut jalan:

1. Backup penuh dulu:
   `mysqldump joomla_db > joomla_db_before_compro_delete.sql` (6,2 MB, di temp).
2. `PATCH /content/articles/{702,703,704}` `{"state": -2}` → 200 (trash dulu,
   karena `DELETE` langsung pada artikel published selalu gagal — quirk API #11).
3. `DELETE /content/articles/{702,703,704}` → 204.

## Dampak frontend — tanpa ubah kode

`frontend/src/components/Contact.tsx:10` mencari item dengan
`baseAlias(alias) === 'request-compro'` dan hanya merender kartu Compro bila
`request?.attributes.link` ada. Setelah hapus, `request` = `undefined` →
kartu hilang sendiri, section Contact tetap tampil (Marketing + Email).
Terverifikasi: `/` dan `/en` HTTP 200, 0 kemunculan `compro`/`drive.google`,
`id="contact"` + Marketing I/II/III tetap ada.

## Rollback

Restore dari backup:
`mysql joomla_db < joomla_db_before_compro_delete.sql`
(backup pra-hapus ada di temp `opencode/`, bukan di repo).
