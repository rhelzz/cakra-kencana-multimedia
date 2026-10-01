/** Cek: default tiga field harus menghasilkan palet yang identik dengan globals.css. */
import assert from 'node:assert';
import { deriveTheme } from '../src/lib/theme.ts';

const { light, dark } = deriveTheme({});
const near = (got: string, want: string, tol = 0.006) => {
  const g = got.match(/[\d.]+/g)!.map(Number);
  const w = want.match(/[\d.]+/g)!.map(Number);
  assert.ok(
    g.slice(0, 3).every((v, i) => Math.abs(v - w[i]) < (i === 2 ? 2 : tol)),
    `${got} != ${want}`,
  );
};

near(light['--background'], 'oklch(1 0 0)');
near(light['--primary'], 'oklch(0.398 0.1435 257.4)');
near(light['--surface-container-low'], 'oklch(0.985 0.0040 257.4)');
near(light['--surface-container-high'], 'oklch(0.945 0.0066 257.4)');
near(light['--accent'], 'oklch(0.960 0.0080 257.4)');
near(light['--border'], 'oklch(0.918 0 0)');
near(dark['--background'], 'oklch(0.155 0.004 265)', 0.01);
near(dark['--primary'], 'oklch(0.550 0.1382 257.4)');
near(dark['--surface-container-high'], 'oklch(0.227 0.0042 257.4)');
assert.equal(dark['--border'], 'oklch(1 0 0 / 12%)');

// Guardrail: "background light" diisi gelap → seluruh slot ikut membalik, teks tetap terbaca.
const flipped = deriveTheme({ backgroundLight: '#101010' }).light;
assert.ok(Number(flipped['--foreground'].match(/[\d.]+/)![0]) > 0.9, 'teks harus terang');
assert.equal(flipped['--border'], 'oklch(1 0 0 / 12%)');

// Brand terang → teks di atas tombol jadi gelap, bukan putih di atas kuning.
assert.ok(deriveTheme({ brand: '#ffd400' }).light['--primary-foreground'].startsWith('oklch(0.200'));

// Hex tidak valid tidak boleh merusak apa pun.
near(deriveTheme({ brand: 'bukan-warna' }).light['--primary'], 'oklch(0.398 0.1435 257.4)');

console.log('theme: ok');

// Field ke-4 kosong = perilaku lama persis, tidak ada yang berubah.
near(deriveTheme({ brandDark: '' }).dark['--primary'], 'oklch(0.550 0.1382 257.4)');
// Diisi = hue/chroma editor dipakai apa adanya.
near(deriveTheme({ brandDark: '#f59e0b' }).dark['--primary'], 'oklch(0.769 0.1687 70.1)');
// Guardrail: aksen gelap yang lebih gelap dari latarnya dinaikkan sampai terlihat.
{
  const p = deriveTheme({ brandDark: '#101010' }).dark['--primary'];
  assert.ok(Number(p.match(/[\d.]+/)![0]) >= 0.43, `aksen gelap harus dinaikkan: ${p}`);
}
console.log('theme: dark brand ok');

// Background berwarna (navy): permukaan wajib ikut hue background, bukan hue brand —
// kalau tidak, kartu abu-kemerahan mengambang di atas navy.
{
  const d = deriveTheme({ brand: '#004392', backgroundDark: '#021236' }).dark;
  const hue = (v: string) => Number(v.match(/[\d.]+/g)![2]);
  const chroma = (v: string) => Number(v.match(/[\d.]+/g)![1]);
  for (const k of ['--card', '--surface-container-low', '--surface-container-high', '--secondary']) {
    assert.ok(Math.abs(hue(d[k]) - hue(d['--background'])) < 5, `${k} lepas dari hue background: ${d[k]}`);
    assert.ok(chroma(d[k]) > 0.02, `${k} terlalu netral di atas background berwarna: ${d[k]}`);
  }
  // Aksen tetap brand — itu yang menandai elemen bisa diklik.
  assert.ok(Math.abs(hue(d['--accent']) - 257.4) < 5, d['--accent']);
}
// Background netral: perilaku lama tidak berubah sama sekali.
near(deriveTheme({}).dark['--card'], 'oklch(0.202 0.0027 257.4)');
near(deriveTheme({}).light['--surface-container'], 'oklch(0.970 0.0053 257.4)');
console.log('theme: colored background ok');
