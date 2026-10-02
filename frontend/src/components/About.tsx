import WhyUs from '@/components/WhyUs';
import Coverage from '@/components/Coverage';
import type { Locale } from '@/lib/i18n';

/**
 * About is two Joomla-driven sections: the why-us pitch and the coverage map
 * with stats. Each part renders nothing when its content is missing, so the
 * page never shows an empty shell.
 */
export default function About({ locale }: { locale: Locale }) {
  return (
    <>
      <WhyUs locale={locale} />
      <Coverage locale={locale} />
    </>
  );
}
