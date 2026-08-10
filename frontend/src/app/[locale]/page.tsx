import { notFound } from 'next/navigation';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Services from '@/components/Services';
import Customers from '@/components/Customers';
import Offices from '@/components/Offices';
import { isLocale } from '@/lib/i18n';

export default async function Home({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <main className="flex-1">
      <Hero locale={locale} />
      <About locale={locale} />
      <Services locale={locale} />
      <Customers locale={locale} />
      <Offices locale={locale} />
    </main>
  );
}
