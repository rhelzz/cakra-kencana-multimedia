# Patch Note — Layout Contact Tanpa Compro

Tanggal: 2026-10-01
Pelaksana: agent (atas izin owner, sesi revisi)
Lanjutan dari: [13 — Hapus Compro](13-patch-note-hapus-compro.md)

## Masalah

Setelah kartu Compro dihapus, layout `Contact` (`frontend/src/components/Contact.tsx`)
masih memakai `lg:grid-cols-[3fr_1fr]` — kolom kanan `1fr` (bekas kartu Compro)
kosong melompong di layar desktop, 4 kartu kontak (Marketing I/II/III, Email)
terjepit di kolom `3fr`.

## Perubahan (hanya layout, tanpa teks/gambar baru)

File: `frontend/src/components/Contact.tsx`

- Tambah flag `hasRequest = Boolean(request?.attributes.link)` (baris 11).
- Bila kartu Compro **tidak ada**: daftar kontak full-width
  `grid sm:grid-cols-2 lg:grid-cols-4` — 4 kartu sejajar di desktop.
- Bila kartu Compro **ada lagi** (mis. dikembalikan via Joomla): layout lama
  `lg:grid-cols-[3fr_1fr]` dipakai kembali otomatis — future-proof, tanpa edit kode.
- Kondisi render kartu (`request?.attributes.link &&`) dan early-return
  dipertahankan agar type-narrowing TypeScript tetap jalan.
- Tetap Server Component async, tanpa state/event handler — sesuai panduan
  `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`.

## Verifikasi

- `npx tsc --noEmit` → bersih.
- `npm run lint` → 0 error, 1 warning lama `no-img-element` di
  `services/[slug]/page.tsx:142` (disengaja, bukan dari perubahan ini).
- Render `/` pasca hot-reload: `lg:grid-cols-4` hadir, `id="contact"` ada,
  Marketing I/II/III + Email tampil, 0 `compro`/`drive.google`.
