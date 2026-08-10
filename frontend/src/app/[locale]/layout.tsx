import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/theme-provider";
import { HTML_LANG, isLocale, localePath, LOCALES } from "@/lib/i18n";
import { bodyOf, getArticle, getSiteName, stripTags } from "@/lib/joomla";

// Poppins is not a variable font on Google Fonts, so the weights the site uses are listed
// explicitly — anything not listed here simply won't download.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

/** Title, description and hreflang all follow the visitor's language. */
export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const [siteName, hero] = await Promise.all([getSiteName(), getArticle("home-hero", locale)]);
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

  return (
    // suppressHydrationWarning: next-themes sets the class on <html> before React hydrates.
    <html
      lang={HTML_LANG[locale]}
      suppressHydrationWarning
      className={`${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <Navbar locale={locale} />
          {children}
          <Footer locale={locale} />
        </ThemeProvider>
      </body>
    </html>
  );
}
