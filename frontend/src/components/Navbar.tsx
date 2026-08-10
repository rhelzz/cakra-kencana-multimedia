import { getMenu, mediaUrl } from '@/lib/joomla';
import { SiteHeader } from '@/components/SiteHeader';
import type { Locale } from '@/lib/i18n';

// Server component: the Joomla token stays here, only plain menu data crosses to the client.
export default async function Navbar({ locale }: { locale: Locale }) {
  const items = await getMenu(locale);
  // Served straight from Joomla's media folder, so the logo can be swapped in the
  // Media Manager without a redeploy.
  return <SiteHeader items={items} logo={mediaUrl('images/logo.png')} locale={locale} />;
}
