import { siFacebook, siInstagram, siTiktok, siWhatsapp, siX, siYoutube } from 'simple-icons';

/**
 * Brand marks come from simple-icons, not lucide: lucide dropped its brand icons for
 * trademark reasons, and hand-copied SVG paths go stale when a brand rebrands.
 * Keys MUST match the option values of the Joomla "Icon" field.
 *
 * LinkedIn is deliberately absent — simple-icons removed it at LinkedIn's request, so a
 * LinkedIn entry falls back to the generic globe below.
 */
export const BRAND_PATHS: Record<string, string> = {
  facebook: siFacebook.path,
  instagram: siInstagram.path,
  youtube: siYoutube.path,
  tiktok: siTiktok.path,
  whatsapp: siWhatsapp.path,
  x: siX.path,
};
