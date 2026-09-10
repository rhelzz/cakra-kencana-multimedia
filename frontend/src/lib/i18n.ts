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
    toggleTheme: 'Ganti mode gelap',
    language: 'Bahasa',
    otherServices: 'Layanan lainnya',
    moreServices: 'Lebih banyak',
    allServices: 'Semua layanan',
    home: 'Beranda',
    serviceUnit: 'Layanan',
    scope: 'Cakupan layanan',
    scopeUnit: 'Item',
    viewServices: 'Lihat layanan',
    exploreCompany: 'Tentang kami',
    skipToContent: 'Langsung ke konten',
    pauseCarousel: 'Jeda galeri',
    resumeCarousel: 'Lanjutkan galeri',
    goToSlide: 'Ke slide',
    contactWhatsapp: 'Chat via WhatsApp',
    contactEmail: 'Kirim Email',
    viewAllClients: 'Lihat semua {count} klien',
    allClients: 'Semua klien',
    clientUnit: 'Klien',
  },
  en: {
    aboutEyebrow: 'About us',
    learnMore: 'Learn More',
    openMap: 'Open Map',
    menu: 'Menu',
    navigation: 'Navigation',
    toggleTheme: 'Toggle dark mode',
    language: 'Language',
    otherServices: 'Other services',
    moreServices: 'More services',
    allServices: 'All services',
    home: 'Home',
    serviceUnit: 'Services',
    scope: 'What this covers',
    scopeUnit: 'Items',
    viewServices: 'View services',
    exploreCompany: 'About us',
    skipToContent: 'Skip to content',
    pauseCarousel: 'Pause gallery',
    resumeCarousel: 'Resume gallery',
    goToSlide: 'Go to slide',
    contactWhatsapp: 'Chat on WhatsApp',
    contactEmail: 'Send Email',
    viewAllClients: 'View all {count} clients',
    allClients: 'All clients',
    clientUnit: 'Clients',
  },
  zh: {
    aboutEyebrow: '关于我们',
    learnMore: '了解更多',
    openMap: '打开地图',
    menu: '菜单',
    navigation: '导航',
    toggleTheme: '切换深色模式',
    language: '语言',
    otherServices: '其他服务',
    moreServices: '更多服务',
    allServices: '全部服务',
    home: '首页',
    serviceUnit: '项服务',
    scope: '服务范围',
    scopeUnit: '项',
    viewServices: '查看服务',
    exploreCompany: '关于我们',
    skipToContent: '跳到内容',
    pauseCarousel: '暂停画廊',
    resumeCarousel: '继续画廊',
    goToSlide: '切换到幻灯片',
    contactWhatsapp: '通过 WhatsApp 联系',
    contactEmail: '发送邮件',
    viewAllClients: '查看全部 {count} 家客户',
    allClients: '全部客户',
    clientUnit: '家客户',
  },
} satisfies Record<Locale, Record<string, string>>;

export const t = (locale: Locale) => UI[locale];
