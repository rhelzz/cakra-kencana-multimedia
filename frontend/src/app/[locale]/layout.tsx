import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/theme-provider";
import { HTML_LANG, isLocale, localePath, LOCALES, t } from "@/lib/i18n";
import { bodyOf, CATEGORY, getArticle, getSiteName, getTheme, stripTags } from "@/lib/joomla";
import { themeCss } from "@/lib/theme";

// Keep the editorial pairing explicit so fallback metrics remain predictable during loading.
// explicitly — anything not listed here simply won't download.
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plexSerif = IBM_Plex_Serif({
  variable: "--font-plex-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
    // suppressHydrationWarning: next-themes sets the class on <html> before React hydrates.
    <html
      lang={HTML_LANG[locale]}
      suppressHydrationWarning
      className={`${plexSans.variable} ${plexSerif.variable} h-full antialiased`}
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: css }} />
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
