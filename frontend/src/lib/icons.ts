import {
  Building2,
  Frame,
  HardHat,
  Layers,
  Megaphone,
  Package,
  Palette,
  PenTool,
  Printer,
  Receipt,
  Ruler,
  Shirt,
  Signpost,
  Store,
  Truck,
  Warehouse,
  type LucideIcon,
} from 'lucide-react';
import { fieldValue } from '@/lib/joomla';

/**
 * Icons an editor can pick in Joomla (field "Icon" on the Services category).
 * The keys MUST match the field's option values.
 *
 * Deliberately a short, hand-picked list rather than lucide's `DynamicIcon`: that variant
 * pulls the whole icon set into the build, and 1500 choices is worse for an editor than 14
 * relevant ones. Direct imports here stay tree-shaken — only these 14 ship.
 * To offer a new icon: import it, add a line below, add the same value in the Joomla field.
 */
export const ICONS: Record<string, LucideIcon> = {
  frame: Frame,
  receipt: Receipt,
  printer: Printer,
  layers: Layers,
  shirt: Shirt,
  package: Package,
  'pen-tool': PenTool,
  signpost: Signpost,
  'hard-hat': HardHat,
  megaphone: Megaphone,
  palette: Palette,
  ruler: Ruler,
  store: Store,
  truck: Truck,
  building: Building2,
  warehouse: Warehouse,
};

export const FALLBACK_ICON = Frame;

/**
 * Never trust the stored value — a renamed option or a typo in Joomla must not blow up
 * the page, so an unknown icon quietly falls back.
 */
export function iconFrom(field: unknown): LucideIcon {
  const value = fieldValue(field);
  return (value && ICONS[value]) || FALLBACK_ICON;
}
