# Dokumentasi — Cakra Kencana Multimedia

Situs company profile *headless*: **Joomla 5 hanya sebagai CMS/backend, Next.js 16 yang merender seluruh halaman.**

Dokumen ini ditulis dalam bahasa Indonesia karena pembacanya adalah kamu dan tim kontenmu.
`CLAUDE.md` di root sengaja tetap bahasa Inggris — pembacanya AI agent, bukan manusia.

## Mulai dari mana

| Kamu ingin… | Baca |
|---|---|
| Paham cara kerja sistemnya | [01 — Arsitektur](01-arsitektur.md) |
| Menjalankan / memasang dari nol | [02 — Setup & Instalasi](02-setup.md) |
| Tahu di mana setiap data disimpan | [03 — Model Konten](03-model-konten.md) |
| **Menambah / mengubah / menghapus isi situs** | [04 — Panduan Editor (CRUD)](04-panduan-editor.md) |
| Tahu apa saja yang kita ubah dari Joomla standar | [05 — Kustomisasi Joomla](05-kustomisasi-joomla.md) |
| Memanggil API Joomla sendiri | [06 — API Joomla](06-api-joomla.md) |
| Menyentuh kode frontend | [07 — Frontend](07-frontend.md) |
| Deploy, backup, atau ada yang rusak | [08 — Operasional](08-operasional.md) |
| **Tahu kelemahan CMS-nya & rencana perbaikan** | [09 — Audit CMS & Rencana](09-audit-cms-ux.md) |
| **Rencana restrukturisasi Service → Detail → Sub-service** | [10 — Rencana Restrukturisasi Layanan](10-rencana-restrukturisasi-layanan.md) |
| **Deploy ke hosting / serah terima ke orang lain** | [11 — Deploy & Serah Terima](11-deploy.md) |

## Aturan utama proyek ini

> **Semua teks dan gambar yang terlihat pengunjung berasal dari Joomla.**
> Kalau kamu hendak menulis teks langsung di dalam kode, berhenti dulu — kemungkinan besar
> tempatnya di Joomla. Pengecualiannya cuma satu: label antarmuka (tombol "Selengkapnya",
> "Buka Peta", judul "Menu"). Alasannya dijelaskan di [07 — Frontend](07-frontend.md#label-antarmuka).

## Peta singkat

```
c:\laragon\www\company-profile\
├── CLAUDE.md      konteks untuk AI agent
├── docs/          dokumen ini
├── backend/       Joomla 5.4.7   → http://company-profile.test/backend/
│   ├── plugins/system/nextrevalidate/   ← satu-satunya kode PHP buatan kita
│   └── images/    logo, hero, gallery, customers  ← unggahan kita
└── frontend/      Next.js 16.3   → http://localhost:3000
    └── src/lib/joomla.ts   ← semua akses API ada di sini
```

Sisanya di `backend/` adalah file core Joomla (~109 MB) yang **tidak dilacak git** dan tidak
pernah kita sentuh.

## Status verifikasi

Angka-angka di dokumen ini (ID kategori, ID field, ID artikel) diverifikasi langsung terhadap
database dan API selama pengerjaan. **ID kategori dan nama field dipakai di dalam kode**, jadi
itu yang harus dijaga. ID artikel bisa berubah kalau kamu hapus-tambah artikel — jangan
mengandalkannya, pakai alias.
