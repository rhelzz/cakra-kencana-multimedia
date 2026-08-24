/**
 * Warna situs diturunkan dari tiga nilai yang diisi editor di Joomla.
 *
 * Palet ini sejak awal ditulis dalam oklch dengan satu hue (~26°) dan chroma yang naik
 * bertahap, jadi 21 token-nya sebenarnya fungsi dari dua angka: hue dan chroma brand.
 * Mengganti hue di oklch aman untuk keterbacaan karena lightness-nya perceptually uniform —
 * `oklch(0.552 …)` terasa sama gelapnya di merah maupun biru. Itu sebabnya lightness setiap
 * token dikunci di sini dan tidak pernah ikut diatur editor: kontras tidak bisa jebol.
 */

type Oklch = { l: number; c: number; h: number };

/** sRGB hex → Oklab → polar. */
export function hexToOklch(hex: string): Oklch {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return { l: 0.552, c: 0.216, h: 26.5 };
  const n = parseInt(m[1], 16);
  const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const r = lin(((n >> 16) & 255) / 255);
  const g = lin(((n >> 8) & 255) / 255);
  const b = lin((n & 255) / 255);
  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;
  const h = (Math.atan2(B, A) * 180) / Math.PI;
  return { l: L, c: Math.hypot(A, B), h: h < 0 ? h + 360 : h };
}

// Hue tidak punya arti saat chroma nol; dinolkan supaya nilainya stabil dan enak dibaca.
const ok = (l: number, c: number, h: number) => {
  const cc = Math.max(c, 0);
  return `oklch(${clamp(l, 0, 1).toFixed(3)} ${cc.toFixed(4)} ${(cc < 0.0005 ? 0 : h).toFixed(1)})`;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Satu slot warna (mode terang atau gelap).
 *
 * Arah tema ditentukan oleh lightness background yang diisi editor, bukan oleh nama slotnya.
 * Kalau "Background light" diisi warna gelap, seluruh turunannya ikut membalik — teks tidak
 * pernah hilang. Ini guardrail yang menggantikan `foreground` sebagai field tersendiri.
 */
function palette(bgHex: string, brand: Oklch, fallbackBgL: number, brandOverride?: Oklch) {
  const bg = hexToOklch(bgHex);
  const bgL = Number.isFinite(bg.l) ? bg.l : fallbackBgL;
  const dark = bgL <= 0.5;
  const H = brand.h;
  const C = brand.c;

  // Offset lightness dan rasio chroma diambil dari palet yang sudah berjalan, supaya
  // default `#d31520 / #ffffff / #0b0c0e` menghasilkan warna yang identik dengan sebelumnya.
  // Rasio chroma di bawah ditulis dengan asumsi background netral (putih atau nyaris hitam),
  // dan permukaan mendapat warnanya dari brand. Asumsi itu runtuh begitu editor mengisi
  // background dengan warna sungguhan: navy dengan kartu bertint merah menghasilkan kartu
  // abu kotor yang mengambang, bukan navy yang lebih terang. Jadi kalau background sendiri
  // sudah berwarna, permukaan mengikuti hue background dan brand hanya menjadi lantai chroma.
  const tinted = bg.c >= 0.015;
  const sH = tinted ? bg.h : H;
  const sC = (ratio: number) => (tinted ? Math.max(bg.c * 0.85, C * ratio) : C * ratio);
  // `secondary` dan `muted` sengaja netral di palet aslinya; di background berwarna, netral
  // murni terbaca sebagai abu kusam, jadi keduanya ikut hue background dengan chroma lebih rendah.
  const nC = tinted ? bg.c * 0.55 : 0;
  const nH = tinted ? bg.h : 0;

  const d = dark
    ? { card: 0.05, low: 0.03, mid: 0.05, high: 0.075, secondary: 0.114, muted: 0.104 }
    : { card: 0, low: -0.015, mid: -0.03, high: -0.055, secondary: -0.03, muted: -0.03 };
  const rc = dark
    ? { card: 0.019, low: 0.019, mid: 0.024, high: 0.029 }
    : { card: 0, low: 0.028, mid: 0.037, high: 0.046 };

  // Di ground gelap brand dinaikkan lightness-nya dan chroma-nya diturunkan sedikit, supaya
  // tetap kontras tanpa terlihat menyala. Editor boleh menimpanya dengan warna sendiri —
  // hue dan chroma pilihannya dipakai apa adanya, hanya lightness yang dijaga tetap di atas
  // latar, karena tombol yang lebih gelap dari background-nya praktis tidak terlihat.
  const auto = { l: clamp(brand.l + 0.083, 0.55, 0.82), c: C * 0.963, h: H };
  const pick = dark ? (brandOverride ?? auto) : brand;
  const primaryL = dark ? clamp(pick.l, bgL + 0.28, 0.92) : pick.l;
  const primary = ok(primaryL, pick.c, pick.h);
  const fg = dark ? 0.975 : 0.145;

  return {
    '--background': ok(bgL, bg.c, bg.h),
    '--foreground': ok(fg, 0, 0),
    '--card': ok(bgL + d.card, sC(rc.card), sH),
    '--card-foreground': ok(fg, 0, 0),
    '--popover': ok(bgL + d.card, sC(rc.card), sH),
    '--popover-foreground': ok(fg, 0, 0),
    '--primary': primary,
    // Teks di atas brand: gelap hanya kalau brand-nya sendiri sudah terang (kuning, lime).
    '--primary-foreground': primaryL > 0.72 ? ok(0.2, 0, 0) : ok(0.99, 0, 0),
    '--secondary': ok(bgL + d.secondary, nC, nH),
    '--secondary-foreground': ok(dark ? 0.985 : 0.205, 0, 0),
    '--muted': ok(bgL + d.muted, nC, nH),
    '--muted-foreground': ok(dark ? 0.715 : 0.505, 0, 0),
    '--surface-container-low': ok(bgL + d.low, sC(rc.low), sH),
    '--surface-container': ok(bgL + d.mid, sC(rc.mid), sH),
    '--surface-container-high': ok(bgL + d.high, sC(rc.high), sH),
    '--accent': ok(dark ? 0.29 : 0.96, pick.c * (dark ? 0.144 : 0.0556), pick.h),
    '--accent-foreground': ok(dark ? 0.93 : 0.35, pick.c * (dark ? 0.144 : 0.648), pick.h),
    // Merah error dikunci: sinyal bahaya tidak boleh ikut berubah kalau brand jadi biru.
    '--destructive': dark ? 'oklch(0.704 0.191 22.216)' : 'oklch(0.577 0.245 27.325)',
    '--border': dark ? 'oklch(1 0 0 / 12%)' : ok(bgL - 0.082, nC, nH),
    '--input': dark ? 'oklch(1 0 0 / 15%)' : ok(bgL - 0.082, nC, nH),
    '--ring': primary,
    // Bayangan bernada brand. Dipecah dua karena `@theme` merakit shadow-nya saat build dan
    // hanya boleh menyisipkan var(), bukan menghitung warna.
    '--shadow-brand-a': ok(brand.l, C * 0.28, H).replace(')', ' / 0.06)'),
    '--shadow-brand-b': ok(brand.l, C, H).replace(')', ' / 0.4)'),
  };
}

export type ThemeInput = {
  brand?: string;
  /** Opsional: aksen mode gelap. Kosong = diturunkan otomatis dari `brand`. */
  brandDark?: string;
  backgroundLight?: string;
  backgroundDark?: string;
};

/** Dua palet lengkap dari tiga hex. Nilai kosong jatuh ke default yang sekarang berlaku. */
export function deriveTheme(input: ThemeInput) {
  const brand = hexToOklch(input.brand || '#d31520');
  const brandDark = input.brandDark?.trim() ? hexToOklch(input.brandDark) : undefined;
  return {
    light: palette(input.backgroundLight || '#ffffff', brand, 1),
    dark: palette(input.backgroundDark || '#0b0c0e', brand, 0.155, brandDark),
  };
}

/** `.dark` tidak bisa ditulis sebagai inline style, jadi kedua palet masuk lewat satu <style>. */
export function themeCss(input: ThemeInput) {
  const { light, dark } = deriveTheme(input);
  const block = (vars: Record<string, string>) =>
    Object.entries(vars)
      .map(([k, v]) => `${k}:${v}`)
      .join(';');
  return `:root{${block(light)}}.dark{${block(dark)}}`;
}
