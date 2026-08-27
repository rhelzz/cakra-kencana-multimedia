# Rilis fitur warna tema ke produksi

Panduan sekali-pakai untuk menaikkan fitur "warna situs diatur dari Joomla" ke
`cakrakencanamultimedia.com`. Kerjakan berurutan, jangan melompat.

Baca bersama [`11-deploy.md`](11-deploy.md) dan `rekap-deployment-cakrakencana.md`.

**Legenda:** `# LOKAL` = PowerShell di laptop · `# VPS` = terminal SSH ·
🔴 = kalau salah, sulit diperbaiki

---

## 0. Kenapa ini tidak sekadar `git pull`

Fitur ini punya **dua bagian yang harus naik bersamaan**:

| Bagian | Ada di mana | Cara naiknya |
|---|---|---|
| Kode: `theme.ts`, `getTheme()`, injeksi CSS | Git | `git pull` + rebuild |
| Data: 4 custom field + artikel `Theme` | Database Joomla | **dibuat manual di admin** |

Kalau cuma kodenya yang naik, situs tetap jalan normal — `getTheme()` gagal dengan
diam dan palet jatuh ke default di `globals.css`. Tidak ada error, tidak ada layar
putih. Cuma panel warnanya tidak ada. Jadi urutan aman: **database dulu, kode belakangan.**

🔴 **JANGAN restore `joomla_db.sql` lokal ke produksi.** Produksi punya konten yang
mungkin sudah diedit sejak 21 Agustus. Menimpanya berarti kehilangan data itu.
Kita hanya menambah 4 field dan 1 artikel lewat panel admin — nol risiko.

---

## 1. 🔴 Backup dulu — ini belum pernah dibuat

Rekap deployment mencatat backup otomatis **belum dikerjakan sama sekali** (butir 3.2).
Jangan sentuh produksi sebelum ini beres. Sekali jalan, sekalian pasang cron-nya.

```bash
# VPS
mkdir -p /opt/ckm/backup
cat > /opt/ckm/backup.sh <<'SCRIPT'
#!/bin/bash
set -e
cd /opt/ckm
set -a; . ./.env; set +a
D=$(date +%F-%H%M)
docker compose exec -T db mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" \
  --single-transaction --default-character-set=utf8mb4 "$MYSQL_DATABASE" \
  | gzip > backup/db-$D.sql.gz
docker run --rm -v ckm_joomla-data:/data -v /opt/ckm/backup:/b alpine \
  tar czf /b/joomla-files-$D.tar.gz -C /data images plugins templates configuration.php
find backup -type f -mtime +14 -delete
echo "backup selesai: $D"
SCRIPT
chmod +x /opt/ckm/backup.sh
/opt/ckm/backup.sh
```

**Yang harus muncul:** `backup selesai: 2026-...`

Verifikasi isinya, bukan cuma ukurannya:

```bash
# VPS
ls -lh /opt/ckm/backup/
zcat /opt/ckm/backup/db-*.sql.gz | tail -3 | grep "Dump completed" && echo "BACKUP VALID"
```

**Yang harus muncul:** dua file (`db-*.sql.gz` ~1 MB, `joomla-files-*.tar.gz`) dan
tulisan `BACKUP VALID`.

Kalau `BACKUP VALID` tidak muncul, **berhenti**. Dump terpotong, dan backup yang tidak
pernah diverifikasi bukan backup.

Pasang jadwal hariannya sekalian:

```bash
# VPS
(crontab -l 2>/dev/null; echo "30 2 * * * /opt/ckm/backup.sh >> /var/log/ckm-backup.log 2>&1") | crontab -
crontab -l
```

---

## 2. Push kode dari laptop

Commit sudah ada di branch `main` lokal. Yang belum: push.

```powershell
# LOKAL
cd c:\laragon\www\company-profile
git log --oneline -1
```

**Yang harus muncul:** `feat(theme): warna situs diatur dari Joomla`

```powershell
# LOKAL
git push origin main
git subtree push --prefix=frontend fe main
```

Perintah kedua wajib pakai `subtree`, bukan `git push fe main`. Remote `fe` itu isi
folder `frontend/` yang dipublikasikan sebagai repo tersendiri — akarnya `frontend/`,
bukan akar project. VPS meng-clone repo **itu**, jadi kalau langkah ini dilewat, VPS
tidak akan melihat perubahan apa pun.

⏱️ `subtree push` menghitung ulang riwayat, bisa 1–3 menit. Sabar.

**Kalau muncul `Updates were rejected`:** ada commit di remote yang belum ada di lokal.
Jangan `--force`. Tarik dulu:

```powershell
# LOKAL
git pull --rebase origin main
```

Verifikasi push-nya benar-benar sampai:

```powershell
# LOKAL
git fetch fe
git log --oneline -1 fe/main
```

**Yang harus muncul:** commit yang sama dengan lokal.

---

## 3. Buat 4 custom field di Joomla produksi

Lewat panel admin, bukan SQL. Cara ini menangani permission dan asset dengan benar,
dan tidak bisa merusak apa pun.

Buka `https://cms.cakrakencanamultimedia.com/administrator` → **Content → Fields**.

🔴 **Pastikan dropdown di pojok kiri atas tertulis `Articles`**, bukan `Contacts` atau
`Users`. Field yang dibuat di konteks salah tidak akan pernah terbaca frontend.

Klik **New**, lalu untuk **masing-masing dari 4 field** di bawah ini:

| Type | Title | **Name** (🔴 isi manual) | Default Value |
|---|---|---|---|
| Color | `Brand color` | `brand-color` | `#c8102e` |
| Color | `Brand color (mode gelap)` | `brand-color-dark` | *(kosongkan)* |
| Color | `Background light` | `background-light` | `#ffffff` |
| Color | `Background dark` | `background-dark` | `#0d0b0b` |

🔴 **Kolom `Name` harus diisi tangan persis seperti tabel.** Joomla mengisinya otomatis
dari Title, dan untuk baris kedua hasilnya jadi `brand-color-mode-gelap` — tidak cocok
dengan yang dibaca kode, jadi warnanya tidak akan pernah terpakai. Kolom `Name` ada
tepat di bawah `Title`.

Untuk setiap field, sebelum Save:

1. Tab **General** → **Type** = `Color`
2. Isi **Title**, lalu **timpa** isi **Name** sesuai tabel
3. Isi **Default Value** sesuai tabel
4. Panel kanan → **Category** → pilih **Uncategorised** saja
5. **Status** = `Published`
6. **Save & New** (untuk 3 field pertama), **Save & Close** (yang terakhir)

Isi kolom Description-nya juga supaya client tahu fungsinya — terutama yang kedua:
*"Opsional. Kosongkan kalau tidak yakin — warna brand akan dicerahkan otomatis agar
tetap kontras di latar gelap."*

**Verifikasi:** daftar Fields harus menampilkan 4 baris baru, semuanya `Articles`,
statusnya hijau, dan kolom Category tertulis `Uncategorised`.

---

## 4. Buat artikel `Theme`

**Content → Articles → New**

| Kolom | Isi |
|---|---|
| Title | `Theme` |
| Alias | `theme` |
| Category | `Uncategorised` |
| **Language** | 🔴 `All` |
| Status | `Published` |
| Isi artikel | `Pengaturan warna situs. Isi warna di panel Fields di sebelah kanan.` |

🔴 **Language wajib `All`**, bukan `Bahasa Indonesia`. Artikel ini dipakai ketiga bahasa
sekaligus. Kalau diset satu bahasa, warnanya hilang di `/en` dan `/zh`.

Alias harus `theme` polos — **tanpa** akhiran `-id`. Aturan akhiran bahasa
(`-id`/`-en`/`-zh`) berlaku untuk konten yang diterjemahkan; artikel ini tidak.

Setelah tab **Content** terisi, buka tab **Fields** di form yang sama. Empat color
picker tadi harus muncul di situ. Isi:

| Field | Nilai |
|---|---|
| Brand color | `#c8102e` |
| Brand color (mode gelap) | *(kosong)* |
| Background light | `#ffffff` |
| Background dark | `#0d0b0b` |

**Kalau tab Fields tidak muncul atau kosong:** field belum ter-assign ke kategori
Uncategorised. Kembali ke §3, buka tiap field, cek panel kanan bagian Category.

Klik **Save & Close**.

**Verifikasi lewat API** — ini membuktikan frontend benar-benar bisa membacanya:

```bash
# VPS
cd /opt/ckm
set -a; . ./.env; set +a
curl -s -H "X-Joomla-Token: $JOOMLA_TOKEN" -H "Accept: application/vnd.api+json" \
  "https://cms.cakrakencanamultimedia.com/api/index.php/v1/content/articles?filter%5Bcategory%5D=2&page%5Blimit%5D=50" \
  | grep -o '"brand-color":"[^"]*"'
```

**Yang harus muncul:** `"brand-color":"#c8102e"`

**Kalau kosong:** nilainya tidak tersimpan. Buka lagi artikelnya di admin, isi ulang
tab Fields, Save. (Menulis nilai custom field lewat API memang bermasalah di project
ini — lewat panel admin selalu jalan.)

---

## 5. Tarik kode baru di VPS

```bash
# VPS
cd /opt/ckm/frontend
git status
```

**Kalau ada `modified: package-lock.json`:** itu sisa jalan pintas Perbaikan #7 waktu
deploy dulu. Lockfile sudah disinkronkan ke GitHub (commit `chore: regenerate
package-lock.json`), jadi versi VPS boleh dibuang:

```bash
# VPS
git checkout -- package-lock.json
```

Lalu tarik:

```bash
# VPS
git pull
git log --oneline -1
```

**Yang harus muncul:** `feat(theme): warna situs diatur dari Joomla`

Pastikan file barunya ikut:

```bash
# VPS
ls -l src/lib/theme.ts scripts/theme.check.ts
```

**Kalau `No such file`:** `git subtree push` di §2 belum jalan. Kembali ke sana.

---

## 6. ⏱️ Rebuild frontend

⏱️ **3–8 menit.** Selama build, **situs lama tetap jalan** — container baru menggantikan
yang lama setelah build selesai. Tidak ada downtime.

```bash
# VPS
cd /opt/ckm
set -a; . ./.env; set +a
docker compose build frontend
```

**Yang harus muncul:** `npm ci`, lalu tabel route Next, diakhiri
`naming to docker.io/library/ckm-frontend`.

| Error | Artinya | Solusi |
|---|---|---|
| `Killed` / `exit code 137` | RAM habis | `swapon --show` — harus 2 GB |
| `Joomla 401` | token salah | ulangi §16.6 panduan lama |
| `EUSAGE` / `Missing: ... from lock file` | lockfile tidak sinkron | `git checkout -- package-lock.json && git pull` |
| `Cannot find module '@/lib/theme'` | file baru tidak ikut ter-pull | balik ke §5 |

Setelah build sukses:

```bash
# VPS
docker compose up -d frontend
docker compose logs --tail=30 frontend
```

**Yang harus muncul:** `✓ Ready in ...ms`

---

## 7. Verifikasi

### 7.1 Palet benar-benar ter-inject

```bash
# VPS
curl -s https://cakrakencanamultimedia.com/ | grep -o "\-\-primary:[^;]*;" | head -1
```

**Yang harus muncul:** `--primary:oklch(0.530 0.2074 22.3);`

**Kalau tidak ada output sama sekali:** `<style>` tidak ter-render — kode lama masih
jalan. Ulangi §5–§6.

**Kalau angkanya `oklch(0.552 0.2160 26.5)`:** itu warna default `globals.css`, artinya
`getTheme()` tidak menemukan artikelnya. Ulangi §4 dan cek verifikasi API-nya.

### 7.2 Ganti warna dari CMS

Ini inti fiturnya — pastikan client benar-benar bisa memakainya.

1. Admin → **Content → Articles → Theme** → tab **Fields**
2. Ubah **Brand color** jadi `#1d4ed8` (biru), **Save**
3. Tunggu ~5 detik, refresh `https://cakrakencanamultimedia.com`

**Yang harus terjadi:** tombol, ikon, dan garis aksen berubah biru.

4. Kembalikan ke `#c8102e`, **Save**

**Kalau tidak berubah:** webhook revalidate belum tuntas (butir 3.6 rekap). Cek plugin
**System → Plugins → Next Revalidate**: URL `http://frontend:3000/api/revalidate`,
Shared secret sama persis dengan `REVALIDATE_SECRET` di `.env`, Status Enabled.

Selama menunggu perbaikan itu, warna tetap berubah — cuma perlu sampai 60 detik
(cache ISR), bukan 5 detik.

### 7.3 Cek yang lain tidak rusak

```bash
# VPS
curl -sI https://cakrakencanamultimedia.com/    | head -1   # 200
curl -sI https://cakrakencanamultimedia.com/en  | head -1   # 200
curl -sI https://cakrakencanamultimedia.com/zh  | head -1   # 200
curl -sI https://cakrakencanamultimedia.com/id  | head -1   # 308
```

Lalu di browser:

- [ ] Mode terang dan gelap, keduanya terbaca (toggle di navbar)
- [ ] Gambar muncul, URL-nya `https://cms.cakrakencanamultimedia.com/images/...`
- [ ] Tombol **"Lihat Layanan"** di hero: klik → scroll ke Services → scroll ke atas →
      klik lagi → **harus tetap scroll**. Ini perbaikan yang ikut di rilis ini.
- [ ] Halaman `/services` dan satu halaman detail layanan

---

## 8. Kalau harus dibatalkan

Fitur ini dirancang supaya batalnya murah — tidak ada migrasi database, tidak ada
kolom yang diubah.

**Batal sebagian (warna kembali default, kode tetap baru):** kosongkan keempat field
di artikel `Theme`, atau unpublish artikelnya. Palet jatuh ke `globals.css`.

**Batal penuh (kembali ke kode lama):**

```bash
# VPS
cd /opt/ckm/frontend
git log --oneline -3
git checkout <hash-commit-sebelumnya>
cd /opt/ckm
docker compose build frontend && docker compose up -d frontend
```

4 field dan artikel `Theme` boleh dibiarkan — kode lama mengabaikannya sepenuhnya.

---

## 9. Setelah rilis

Yang masih menggantung dari rekap deployment, diurutkan dari yang paling mendesak:

- [ ] Record DNS `cms` dikembalikan (butir 3.1) — kalau belum, perpanjangan SSL untuk
      subdomain itu akan gagal
- [x] Backup otomatis (butir 3.2) — beres di §1 panduan ini
- [ ] Backup disalin ke luar VPS: `scp root@103.253.212.112:/opt/ckm/backup/db-*.sql.gz D:\backup-ckm\`
- [ ] Verifikasi port dari luar (butir 3.3)
- [ ] Tes reboot (butir 3.4)
- [ ] Konfirmasi webhook revalidate (butir 3.6)

Dan satu tugas baru: ajari client cara memakai panelnya. Cukup satu kalimat —
*"Content → Articles → Theme → tab Fields, ganti warnanya, Save."*
