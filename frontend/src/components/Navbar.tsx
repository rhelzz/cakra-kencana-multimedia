import { getMenu, getSiteName, mediaUrl } from '@/lib/joomla';
import { SiteHeader } from '@/components/SiteHeader';
import type { Locale } from '@/lib/i18n';

// Server component: the Joomla token stays here, only plain menu data crosses to the client.
export default async function Navbar({ locale }: { locale: Locale }) {
  const [items, siteName] = await Promise.all([getMenu(locale), getSiteName()]);
  // Served straight from Joomla's media folder, so the logo can be swapped in the
  // Media Manager without a redeploy. The name comes from Joomla's Global Configuration
  // rather than a string in here, same as the footer and the page title.
  return (
    <SiteHeader
      items={items}
      logo={mediaUrl('images/logo.png')}
      siteName={siteName}
      locale={locale}
    />
  );
}
