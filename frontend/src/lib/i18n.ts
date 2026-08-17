/** Indonesian is the primary language and has no URL prefix; the rest do. */
export const LOCALES = ['id', 'en', 'zh'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'id';

/** URL segment → Joomla content language code. */
export const JOOMLA_LANG: Record<Locale, string> = {
  id: 'id-ID',
  en: 'en-GB',
  zh: 'zh-CN',
};

/** For <html lang> and hreflang. */
export const HTML_LANG: Record<Locale, string> = {
  id: 'id-ID',
  en: 'en-GB',
  zh: 'zh-CN',
};

export const LOCALE_NAMES: Record<Locale, string> = {
  id: 'Bahasa Indonesia',
  en: 'English',
  zh: '中文',
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Path for a locale: the default one stays at the root. */
export const localePath = (locale: Locale) => (locale === DEFAULT_LOCALE ? '/' : `/${locale}`);

/**
 * Interface labels — buttons and eyebrows, not editorial content. These stay in code so
 * they can't go missing when someone forgets to translate an article in Joomla.
 */
export const UI = {
  id: {
    aboutEyebrow: 'Tentang kami',
    learnMore: 'Selengkapnya',
    openMap: 'Buka Peta',
    menu: 'Menu',
    navigation: 'Navigasi',
    backToTop: 'Kembali ke atas',
    toggleTheme: 'Ganti mode gelap',
    language: 'Bahasa',
    otherServices: 'Layanan lainnya',
    moreServices: 'Lebih banyak',
    allServices: 'Semua layanan',
    home: 'Beranda',
    serviceUnit: 'Layanan',
    scope: 'Cakupan layanan',
    scopeUnit: 'Item',
  },
  en: {
    aboutEyebrow: 'About us',
    learnMore: 'Learn More',
    openMap: 'Open Map',
    menu: 'Menu',
    navigation: 'Navigation',
    backToTop: 'Back to top',
    toggleTheme: 'Toggle dark mode',
    language: 'Language',
    otherServices: 'Other services',
    moreServices: 'More services',
    allServices: 'All services',
    home: 'Home',
    serviceUnit: 'Services',
    scope: 'What this covers',
    scopeUnit: 'Items',
  },
  zh: {
    aboutEyebrow: '关于我们',
    learnMore: '了解更多',
    openMap: '打开地图',
    menu: '菜单',
    navigation: '导航',
    backToTop: '返回顶部',
    toggleTheme: '切换深色模式',
    language: '语言',
    otherServices: '其他服务',
    moreServices: '更多服务',
    allServices: '全部服务',
    home: '首页',
    serviceUnit: '项服务',
    scope: '服务范围',
    scopeUnit: '项',
  },
} satisfies Record<Locale, Record<string, string>>;

export const t = (locale: Locale) => UI[locale];
