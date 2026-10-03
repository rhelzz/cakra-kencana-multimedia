import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import { notFound } from "next/navigation";
import Script from "next/script";
import "../globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/theme-provider";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import { HTML_LANG, isLocale, localePath, LOCALES, t } from "@/lib/i18n";
import { bodyOf, CATEGORY, getArticle, getSiteName, getTheme, stripTags } from "@/lib/joomla";
import { themeCss } from "@/lib/theme";

// Keep the editorial pairing explicit so fallback metrics remain predictable during loading.
// explicitly — anything not listed here simply won't download.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

/** Title, description and hreflang all follow the visitor's language. */
export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const [siteName, hero] = await Promise.all([
    getSiteName(),
    getArticle("home-hero", locale, CATEGORY.uncategorised),
  ]);
  const description = stripTags(hero ? bodyOf(hero) : "");

  return {
    title: hero ? `${hero.attributes.title} | ${siteName}` : siteName,
    description,
    alternates: {
      canonical: localePath(locale),
      languages: Object.fromEntries(
        LOCALES.map((l) => [HTML_LANG[l], localePath(l)]),
      ),
    },
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  // Only the three known locales exist; "/xx" is a 404, not a silent fallback.
  if (!isLocale(locale)) notFound();

  // Warna di-render di server dan disisipkan sebelum <body>, jadi tidak ada satu frame pun
  // dengan palet lama. globals.css tetap jadi fallback kalau Joomla tidak menjawab.
  const css = themeCss(await getTheme());

  return (
    // suppressHydrationWarning: the theme script below sets the class on <html>
    // before React hydrates, so the server-rendered markup may differ by design.
    <html
      lang={HTML_LANG[locale]}
      suppressHydrationWarning
      className={`${inter.variable} ${sora.variable} h-full antialiased`}
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        {/* Blocking theme boot (no FOUC): mirrors the provider's resolution, so the
            first paint already carries the right class. next/script hoists this
            properly — a raw <script> in a component trips React 19's warning. */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
        >{`try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})||"system";if(t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`}</Script>
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <a href="#main-content" className="skip-link rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-brand">
            {t(locale).skipToContent}
          </a>
          <Navbar locale={locale} />
          {children}
          <Footer locale={locale} />
        </ThemeProvider>
      </body>
    </html>
  );
}
